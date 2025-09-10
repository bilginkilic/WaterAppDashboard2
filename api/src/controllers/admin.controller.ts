import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { firebaseAdmin } from '../config/firebase';
import { WaterprintProfile } from '../types/waterprint';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  waterprintData?: WaterprintProfile[];
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@waterapp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const adminLogin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Firebase ile kullanıcıyı doğrula
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
    
    // Admin kontrolü
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Admin yetkisi gerekli' });
    }

    // Firebase token oluştur
    const customToken = await firebaseAdmin.auth().createCustomToken(userRecord.uid, {
      admin: true
    });

    res.json({
      token: customToken,
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
    // Get all users from Firebase
    const userList = await firebaseAdmin.auth().listUsers();
    
    // Get waterprint data for each user
    const usersWithData: UserData[] = await Promise.all(
      userList.users.map(async (user) => {
        try {
          // Get user's waterprint data from Firestore
          const waterprintSnapshot = await firebaseAdmin.firestore()
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
    // Get all users from Firebase
    const userList = await firebaseAdmin.auth().listUsers();
    
    // Get waterprint data - Updated collection name
    const waterprintSnapshot = await firebaseAdmin.firestore()
      .collection('WaterprintProfiles')
      .get();

    const waterprintData = new Map();
    
    waterprintSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!waterprintData.has(data.userId)) {
        waterprintData.set(data.userId, {
          initialWaterprint: data.initialWaterprint || 0,
          currentWaterprint: data.currentWaterprint || 0,
          tasksCompleted: (data.completedTasks || []).length,
          startDate: data.initialAssessment?.date || null,
          correctAnswers: data.initialAssessment?.correctAnswersCount || 0
        });
      }
    });

    // Process user data
    const users = userList.users.map(user => ({
      id: user.uid,
      username: user.displayName || user.email || 'Unknown User',
      totalWaterAmount: waterprintData.get(user.uid)?.currentWaterprint || 0,
      rank: 0  // Will be calculated later
    }));

    // Calculate best initial scores
    const bestInitialScores = userList.users
      .filter(user => waterprintData.has(user.uid) && waterprintData.get(user.uid).initialWaterprint > 0)
      .map(user => ({
        name: user.displayName || user.email || 'Unknown User',
        initialWaterprint: waterprintData.get(user.uid).initialWaterprint,
        correctAnswers: waterprintData.get(user.uid).correctAnswers
      }))
      .sort((a, b) => a.initialWaterprint - b.initialWaterprint)
      .slice(0, 5);

    // Calculate best improvements
    const bestImprovements = userList.users
      .filter(user => {
        const data = waterprintData.get(user.uid);
        return data && data.initialWaterprint > 0 && data.currentWaterprint > 0;
      })
      .map(user => {
        const data = waterprintData.get(user.uid);
        const improvementPercent = ((data.initialWaterprint - data.currentWaterprint) / data.initialWaterprint * 100);
        
        return {
          name: user.displayName || user.email || 'Unknown User',
          improvement: improvementPercent.toFixed(2),
          initialWaterprint: data.initialWaterprint,
          currentWaterprint: data.currentWaterprint,
          tasksCompleted: data.tasksCompleted
        };
      })
      .sort((a, b) => parseFloat(b.improvement) - parseFloat(a.improvement))
      .slice(0, 5);

    // Calculate statistics
    const totalUsers = userList.users.length;
    const totalTasks = Array.from(waterprintData.values()).reduce((acc, data) => acc + data.tasksCompleted, 0);

    // Average improvement calculation
    let totalImprovement = 0;
    let userCount = 0;
    
    userList.users.forEach(user => {
      const data = waterprintData.get(user.uid);
      if (data && data.initialWaterprint > 0 && data.currentWaterprint > 0) {
        totalImprovement += ((data.initialWaterprint - data.currentWaterprint) / data.initialWaterprint * 100);
        userCount++;
      }
    });
    
    const averageImprovement = userCount > 0 ? (totalImprovement / userCount).toFixed(2) : '0';

    const leaderboardData = {
      users,
      bestInitialScores,
      bestImprovements,
      statistics: {
        totalUsers,
        averageImprovement,
        totalTasksCompleted: totalTasks,
        averageTasksPerUser: (totalTasks / (totalUsers || 1)).toFixed(1)
      }
    };

    res.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
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
    // Kullanıcı listesini al
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users;
    console.log('Total users:', users.length);
    
    // Son 30 gün içinde giriş yapmış kullanıcıları aktif sayalım
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = users.filter(user => {
      const lastSignIn = user.metadata.lastSignInTime 
        ? new Date(user.metadata.lastSignInTime) 
        : null;
      return lastSignIn && lastSignIn > thirtyDaysAgo;
    }).length;
    console.log('Active users:', activeUsers);

    // Waterprint verilerini al
    const waterprintSnapshot = await firebaseAdmin.firestore()
      .collection('WaterprintProfiles')
      .get();

    const waterprints = waterprintSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Waterprint data:', data);
      return data;
    });
    console.log('Total waterprints:', waterprints.length);
    
    // Ortalama su tüketimini hesapla
    const averageWaterUsage = waterprints.length > 0
      ? Math.round(waterprints.reduce((acc, curr) => {
          const usage = curr.totalWaterUsage || 0;
          console.log('Water usage:', usage);
          return acc + usage;
        }, 0) / waterprints.length)
      : 0;
    console.log('Average water usage:', averageWaterUsage);

    // Toplam tasarrufu hesapla (başlangıç - şimdiki tüketim)
    const totalWaterSaved = waterprints.reduce((acc, curr) => {
      const initial = curr.initialWaterUsage || 0;
      const current = curr.totalWaterUsage || 0;
      const saved = initial - current;
      console.log('Initial:', initial, 'Current:', current, 'Saved:', saved);
      return acc + (saved > 0 ? saved : 0);
    }, 0);
    console.log('Total water saved:', totalWaterSaved);

    const stats = {
      totalUsers: users.length,
      activeUsers,
      averageWaterUsage,
      totalWaterSaved: Math.round(totalWaterSaved),
    };
    console.log('Final stats:', stats);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
}; 