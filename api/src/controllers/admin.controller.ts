import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { admin } from '../config/firebase';
import { WaterprintProfile } from '../types/waterprint';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  waterprintData?: WaterprintProfile[];
}

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Static admin credentials check
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { username, isAdmin: true },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        message: 'Admin login successful'
      });
    }

    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

export const getUserList = async (req: Request, res: Response) => {
  try {
    // Get all users from Firebase
    const userList = await admin.auth().listUsers();
    
    // Get waterprint data for each user
    const usersWithData: UserData[] = await Promise.all(
      userList.users.map(async (user) => {
        try {
          // Get user's waterprint data from Firestore
          const waterprintSnapshot = await admin.firestore()
            .collection('waterprints')
            .where('userId', '==', user.uid)
            .orderBy('date', 'desc')
            .get();

          const waterprintData = waterprintSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as WaterprintProfile[];

          return {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || null,
            lastLoginAt: user.metadata.lastSignInTime || null,
            createdAt: user.metadata.creationTime || '',
            waterprintData
          };
        } catch (error) {
          console.error(`Error fetching data for user ${user.uid}:`, error);
          return {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || null,
            lastLoginAt: user.metadata.lastSignInTime || null,
            createdAt: user.metadata.creationTime || '',
            waterprintData: []
          };
        }
      })
    );

    res.json(usersWithData);
  } catch (error) {
    console.error('Error fetching user list:', error);
    res.status(500).json({ message: 'Error fetching user list', error });
  }
};

export const getLeaderboards = async (req: Request, res: Response) => {
  try {
    const profilesSnapshot = await admin.firestore()
      .collection('WaterprintProfiles')
      .get();

    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaterprintProfile[];

    // Calculate best initial scores (lowest initial waterprint)
    const bestInitialScores = [...profiles]
      .sort((a, b) => a.initialWaterprint - b.initialWaterprint)
      .slice(0, 10)
      .map(async profile => {
        const user = await admin.auth().getUser(profile.userId);
        return {
          name: user.displayName || 'Anonymous',
          initialWaterprint: profile.initialWaterprint,
          correctAnswers: profile.initialAssessment.correctAnswersCount
        };
      });

    // Calculate best improvements
    const bestImprovements = [...profiles]
      .map(profile => ({
        ...profile,
        improvement: ((profile.initialWaterprint - profile.currentWaterprint) / profile.initialWaterprint) * 100
      }))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 10)
      .map(async profile => {
        const user = await admin.auth().getUser(profile.userId);
        return {
          name: user.displayName || 'Anonymous',
          improvement: profile.improvement.toFixed(2),
          initialWaterprint: profile.initialWaterprint,
          currentWaterprint: profile.currentWaterprint,
          tasksCompleted: profile.completedTasks.length
        };
      });

    const [bestInitial, bestImprovement] = await Promise.all([
      Promise.all(bestInitialScores),
      Promise.all(bestImprovements)
    ]);

    // Calculate statistics
    const totalUsers = profiles.length;
    const averageImprovement = profiles.length > 0 
      ? (profiles.reduce((acc, profile) => 
          acc + ((profile.initialWaterprint - profile.currentWaterprint) / profile.initialWaterprint) * 100, 0
        ) / profiles.length).toFixed(2)
      : "0.00";

    const totalTasksCompleted = profiles.reduce((acc, profile) => acc + profile.completedTasks.length, 0);
    const averageTasksPerUser = (totalTasksCompleted / totalUsers).toFixed(1);

    return res.json({
      bestInitialScores: bestInitial,
      bestImprovements: bestImprovement,
      statistics: {
        totalUsers,
        averageImprovement,
        totalTasksCompleted,
        averageTasksPerUser
      }
    });
  } catch (error) {
    console.error('Leaderboards error:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}; 