import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { admin } from '../config/firebase';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const createInitialProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { initialWaterprint, answers, correctAnswersCount } = req.body;
    const userId = req.user?.userId;

    const profileData = {
      userId,
      initialWaterprint,
      currentWaterprint: initialWaterprint,
      initialAssessment: {
        answers,
        correctAnswersCount,
        date: admin.firestore.Timestamp.now()
      },
      completedTasks: [],
      progressHistory: [{
        date: admin.firestore.Timestamp.now(),
        waterprint: initialWaterprint
      }]
    };

    const profileRef = await admin.firestore().collection('WaterprintProfiles').add(profileData);

    res.status(201).json({
      profileId: profileRef.id,
      message: 'Başlangıç profili oluşturuldu'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateWaterprint = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentWaterprint, taskId, waterprintReduction } = req.body;
    const userId = req.user?.userId;

    const profileSnapshot = await admin.firestore()
      .collection('WaterprintProfiles')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (profileSnapshot.empty) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileRef = profileSnapshot.docs[0].ref;
    const profileData = profileSnapshot.docs[0].data();

    const newWaterprint = currentWaterprint - waterprintReduction;
    const totalReduction = profileData.initialWaterprint - newWaterprint;

    await profileRef.update({
      currentWaterprint: newWaterprint,
      completedTasks: admin.firestore.FieldValue.arrayUnion({
        taskId,
        waterprintReduction,
        completionDate: admin.firestore.Timestamp.now()
      }),
      progressHistory: admin.firestore.FieldValue.arrayUnion({
        date: admin.firestore.Timestamp.now(),
        waterprint: newWaterprint
      })
    });

    res.json({
      newWaterprint,
      totalReduction
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profileSnapshot = await admin.firestore()
      .collection('WaterprintProfiles')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (profileSnapshot.empty) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profileData = profileSnapshot.docs[0].data();

    res.json({
      initialWaterprint: profileData.initialWaterprint,
      currentWaterprint: profileData.currentWaterprint,
      waterprintReduction: profileData.initialWaterprint - profileData.currentWaterprint,
      correctAnswersCount: profileData.initialAssessment.correctAnswersCount,
      completedTasks: profileData.completedTasks,
      progressHistory: profileData.progressHistory
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 