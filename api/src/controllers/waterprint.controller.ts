import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { admin } from '../config/firebase';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const profiles = () => admin.firestore().collection('WaterprintProfiles');

async function findProfile(userId: string) {
  const snap = await profiles().where('userId', '==', userId).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

/** Non-negative finite number, or null. */
function footprintValue(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

export const createInitialProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { answers, correctAnswersCount } = req.body;
    const initialWaterprint = footprintValue(req.body.initialWaterprint);
    if (initialWaterprint === null) {
      return res.status(400).json({ message: 'initialWaterprint must be a non-negative number' });
    }
    const userId = req.user!.userId;
    const now = admin.firestore.Timestamp.now();
    const initialAssessment = { answers, correctAnswersCount, date: now };

    const existing = await findProfile(userId);
    if (existing) {
      await existing.ref.update({
        initialWaterprint,
        currentWaterprint: initialWaterprint,
        initialAssessment,
        completedTasks: [],
        progressHistory: [{ date: now, waterprint: initialWaterprint }],
      });
      return res.status(200).json({ profileId: existing.id, message: 'Profil güncellendi' });
    }

    const profileRef = await profiles().add({
      userId,
      initialWaterprint,
      currentWaterprint: initialWaterprint,
      initialAssessment,
      completedTasks: [],
      progressHistory: [{ date: now, waterprint: initialWaterprint }],
      createdAt: now,
    });

    res.status(201).json({ profileId: profileRef.id, message: 'Başlangıç profili oluşturuldu' });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const syncProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { answers, correctAnswersCount } = req.body;
    const initialWaterprint = footprintValue(req.body.initialWaterprint);
    const currentWaterprint = footprintValue(req.body.currentWaterprint);
    if (initialWaterprint === null || currentWaterprint === null) {
      return res.status(400).json({ message: 'Footprint values must be non-negative numbers' });
    }
    if (currentWaterprint > initialWaterprint) {
      return res.status(400).json({ message: 'currentWaterprint cannot exceed initialWaterprint' });
    }

    const userId = req.user!.userId;
    const now = admin.firestore.Timestamp.now();
    const existing = await findProfile(userId);

    if (!existing) {
      const profileRef = await profiles().add({
        userId,
        initialWaterprint,
        currentWaterprint,
        initialAssessment: {
          answers: answers || [],
          correctAnswersCount: correctAnswersCount || 0,
          date: now,
        },
        completedTasks: [],
        progressHistory: [{ date: now, waterprint: currentWaterprint }],
        createdAt: now,
      });
      return res.status(201).json({ profileId: profileRef.id, message: 'Profil oluşturuldu' });
    }

    const existingData = existing.data() || {};
    const update: Record<string, unknown> = {
      initialWaterprint,
      currentWaterprint,
      initialAssessment: {
        answers: answers || existingData.initialAssessment?.answers || [],
        correctAnswersCount:
          correctAnswersCount ?? existingData.initialAssessment?.correctAnswersCount ?? 0,
        date: existingData.initialAssessment?.date || now,
      },
    };
    // The app syncs on every launch; only a real change belongs in the history chart.
    if (existingData.currentWaterprint !== currentWaterprint) {
      update.progressHistory = admin.firestore.FieldValue.arrayUnion({
        date: now,
        waterprint: currentWaterprint,
      });
    }
    await existing.ref.update(update);

    res.json({ profileId: existing.id, message: 'Profil senkronize edildi' });
  } catch (error) {
    console.error('Sync profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWaterprint = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.body;
    const waterprintReduction = footprintValue(req.body.waterprintReduction);
    if (waterprintReduction === null) {
      return res.status(400).json({ message: 'waterprintReduction must be a non-negative number' });
    }
    const userId = req.user!.userId;

    const existing = await findProfile(userId);
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileData = existing.data() || {};
    // Reduce from the stored value; the client's copy may already include this reduction.
    const stored = footprintValue(profileData.currentWaterprint) ?? footprintValue(profileData.initialWaterprint) ?? 0;
    const newWaterprint = Math.max(0, stored - waterprintReduction);
    const totalReduction = (footprintValue(profileData.initialWaterprint) ?? stored) - newWaterprint;
    const now = admin.firestore.Timestamp.now();

    await existing.ref.update({
      currentWaterprint: newWaterprint,
      completedTasks: admin.firestore.FieldValue.arrayUnion({
        taskId,
        waterprintReduction,
        completionDate: now,
      }),
      progressHistory: admin.firestore.FieldValue.arrayUnion({
        date: now,
        waterprint: newWaterprint,
      }),
    });

    res.json({ newWaterprint, totalReduction });
  } catch (error) {
    console.error('Update waterprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Cannot read another user\'s progress' });
    }

    const existing = await findProfile(userId);
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileData = existing.data() || {};

    res.json({
      initialWaterprint: profileData.initialWaterprint,
      currentWaterprint: profileData.currentWaterprint,
      waterprintReduction: profileData.initialWaterprint - profileData.currentWaterprint,
      correctAnswersCount: profileData.initialAssessment?.correctAnswersCount ?? 0,
      completedTasks: profileData.completedTasks || [],
      progressHistory: profileData.progressHistory || [],
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
