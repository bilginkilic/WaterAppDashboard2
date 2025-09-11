import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { firebaseAdmin } from '../config/firebase';
import jwt from 'jsonwebtoken';

interface UserData {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  waterprintData?: WaterprintProfile[];
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@waterapp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin kullanıcısını kontrol et veya oluştur
const ensureAdminUser = async () => {
  try {
    try {
      // Önce kullanıcıyı bulmaya çalış
      await firebaseAdmin.auth().getUserByEmail(ADMIN_EMAIL);
    } catch (error) {
      // Kullanıcı bulunamadıysa oluştur
      if (error.code === 'auth/user-not-found') {
        await firebaseAdmin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true,
        });
        console.log('Admin user created successfully');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    throw error;
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Admin kullanıcısının varlığını kontrol et
    await ensureAdminUser();

    // Email kontrolü
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Admin yetkisi gerekli' });
    }

    // Password kontrolü
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Geçersiz şifre' });
    }

    // Firebase ile kullanıcıyı al
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);

    // Custom token oluştur
    const customToken = await firebaseAdmin.auth().createCustomToken(userRecord.uid, {
      admin: true
    });

    // JWT token oluştur
    const token = jwt.sign(
      { userId: userRecord.uid, email: userRecord.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userId: userRecord.uid,
      name: userRecord.email,
      message: 'Admin girişi başarılı'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(401).json({ message: 'Geçersiz email veya şifre' });
  }
};

export const getUserList = async (req: Request, res: Response) => {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      id: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime || null,
    }));
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
  }
};

export const getLeaderboards = async (req: Request, res: Response) => {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users;

    // Kullanıcı verilerini topla
    const userDataPromises = users.map(async (user) => {
      try {
        // Firestore'dan kullanıcı verilerini al
        const userDoc = await firebaseAdmin.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (!userData) {
          return null;
        }

        return {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          initialWaterprint: userData.initialWaterprint || 0,
          currentWaterprint: userData.currentWaterprint || 0,
          waterprintReduction: userData.waterprintReduction || 0,
          lastUpdate: userData.lastUpdate || null,
        };
      } catch (error) {
        console.error(`Error fetching data for user ${user.uid}:`, error);
        return null;
      }
    });

    const usersData = (await Promise.all(userDataPromises)).filter(Boolean);

    // En çok su tasarrufu yapanlar
    const topSavers = [...usersData]
      .sort((a, b) => (b.waterprintReduction || 0) - (a.waterprintReduction || 0))
      .slice(0, 5);

    // En düşük su ayak izine sahip olanlar
    const lowestWaterprint = [...usersData]
      .sort((a, b) => (a.currentWaterprint || 0) - (b.currentWaterprint || 0))
      .slice(0, 5);

    res.json({
      topSavers,
      lowestWaterprint,
    });
  } catch (error) {
    console.error('Error getting leaderboards:', error);
    res.status(500).json({ error: 'Liderlik tablosu alınamadı' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      id: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime || null,
    }));
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Kullanıcı listesi alınamadı' });
  }
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    // Tüm kullanıcıları al
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const totalUsers = listUsersResult.users.length;

    // Firestore'dan tüm kullanıcı verilerini al
    const usersSnapshot = await firebaseAdmin.firestore().collection('users').get();
    const userData = usersSnapshot.docs.map(doc => doc.data());

    // Toplam su tasarrufu
    const totalWaterprintReduction = userData.reduce((sum, user) => sum + (user.waterprintReduction || 0), 0);

    // Ortalama su ayak izi
    const totalCurrentWaterprint = userData.reduce((sum, user) => sum + (user.currentWaterprint || 0), 0);
    const averageWaterprint = totalUsers > 0 ? totalCurrentWaterprint / totalUsers : 0;

    // Son 7 gündeki aktif kullanıcılar
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = listUsersResult.users.filter(user => {
      const lastSignIn = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
      return lastSignIn && lastSignIn > sevenDaysAgo;
    }).length;

    res.json({
      totalUsers,
      activeUsers,
      totalWaterprintReduction,
      averageWaterprint,
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
};