import dotenv from 'dotenv';
import { admin } from './config/firebase';

dotenv.config();

async function testAdminDashboard() {
  try {
    // Create multiple test users with different water footprints
    const testUsers = [
      {
        email: 'user4@example.com',
        password: 'test123456',
        displayName: 'Super Saver',
        initialWaterprint: 600,
        currentWaterprint: 400
      },
      {
        email: 'user5@example.com',
        password: 'test123456',
        displayName: 'Rapid Improver',
        initialWaterprint: 1500,
        currentWaterprint: 500
      },
      {
        email: 'user6@example.com',
        password: 'test123456',
        displayName: 'Steady Progress',
        initialWaterprint: 900,
        currentWaterprint: 700
      }
    ];

    console.log('Creating test users and profiles...');
    
    for (const testUser of testUsers) {
      // Create user
      const userRecord = await admin.auth().createUser({
        email: testUser.email,
        password: testUser.password,
        displayName: testUser.displayName
      });

      // Create profile
      const profileData = {
        userId: userRecord.uid,
        initialWaterprint: testUser.initialWaterprint,
        currentWaterprint: testUser.currentWaterprint,
        initialAssessment: {
          answers: [
            { questionId: '1', answer: 'yes', isCorrect: true },
            { questionId: '2', answer: 'no', isCorrect: false }
          ],
          correctAnswersCount: 1,
          date: admin.firestore.Timestamp.now()
        },
        completedTasks: testUser.displayName === 'Rapid Improver' ? [
          {
            taskId: 'task1',
            waterprintReduction: 500,
            completionDate: admin.firestore.Timestamp.now()
          },
          {
            taskId: 'task2',
            waterprintReduction: 500,
            completionDate: admin.firestore.Timestamp.now()
          }
        ] : testUser.displayName === 'Super Saver' ? [
          {
            taskId: 'task1',
            waterprintReduction: 100,
            completionDate: admin.firestore.Timestamp.now()
          },
          {
            taskId: 'task2',
            waterprintReduction: 100,
            completionDate: admin.firestore.Timestamp.now()
          }
        ] : [],
        progressHistory: [{
          date: admin.firestore.Timestamp.now(),
          waterprint: testUser.initialWaterprint
        }]
      };

      const profileRef = await admin.firestore()
        .collection('WaterprintProfiles')
        .add(profileData);

      console.log(`Created user and profile for ${testUser.displayName}`);
      console.log('User ID:', userRecord.uid);
      console.log('Profile ID:', profileRef.id);
      console.log('---');
    }

    console.log('\nTest data created successfully!');
    console.log('\nYou can now test the admin dashboard with:');
    console.log('username: admin');
    console.log('password: admin123');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    process.exit();
  }
}

testAdminDashboard(); 