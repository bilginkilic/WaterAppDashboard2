import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { admin, signInWithPassword } from '../config/firebase';
import { getJwtSecret } from '../config/jwt';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const signUserToken = (userId: string) =>
  jwt.sign({ userId }, getJwtSecret(), { expiresIn: '30d' });

/** Keeps users/{uid} filled so the dashboard can show email and name without Auth. */
async function upsertUserDoc(uid: string, fields: Record<string, unknown>) {
  await admin.firestore().collection('users').doc(uid).set(fields, { merge: true });
}

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({ email, password, displayName: name });
    } catch (error) {
      if ((error as { code?: string })?.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: 'Email already registered' });
      }
      throw error;
    }

    const now = new Date().toISOString();
    await upsertUserDoc(userRecord.uid, {
      email,
      name,
      displayName: name,
      createdAt: now,
      lastLoginAt: now,
    });

    res.status(201).json({
      userId: userRecord.uid,
      token: signUserToken(userRecord.uid),
      message: 'Kayıt başarılı'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const uid = await signInWithPassword(email, password);
    if (!uid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userRecord = await admin.auth().getUser(uid);
    await upsertUserDoc(uid, {
      email: userRecord.email || email,
      ...(userRecord.displayName ? { name: userRecord.displayName, displayName: userRecord.displayName } : {}),
      lastLoginAt: new Date().toISOString(),
    });

    res.json({
      userId: userRecord.uid,
      token: signUserToken(userRecord.uid),
      name: userRecord.displayName
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Send password reset email through Firebase
    await admin.auth().generatePasswordResetLink(email);

    res.json({
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Password resets go through Firebase's own emailed link. This endpoint used to
 * treat the "token" as a uid, which let anyone set any user's password.
 */
export const resetPassword = async (_req: Request, res: Response) => {
  res.status(410).json({ message: 'Use the password reset link sent by e-mail' });
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { userId: requestedUserId } = req.body ?? {};
    if (requestedUserId && requestedUserId !== userId) {
      return res.status(403).json({ message: 'Cannot delete another user account' });
    }

    const db = admin.firestore();
    const [profilesSnap, waterprintsSnap] = await Promise.all([
      db.collection('WaterprintProfiles').where('userId', '==', userId).get(),
      db.collection('waterprints').where('userId', '==', userId).get(),
    ]);

    const batch = db.batch();
    profilesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    waterprintsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection('users').doc(userId));
    await batch.commit();

    await admin.auth().deleteUser(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};
