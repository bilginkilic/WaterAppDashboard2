import dotenv from 'dotenv';
import { admin } from './config/firebase';
import { Request, Response } from 'express';

dotenv.config();

async function testFirebaseConnection() {
  try {
    // Test user creation
    const testUser = {
      email: 'test@example.com',
      password: 'test123456',
      displayName: 'Test User'
    };

    console.log('Creating test user...');
    const userRecord = await admin.auth().createUser(testUser);
    console.log('Successfully created test user:', userRecord.uid);

    // Test Firestore
    console.log('\nCreating test waterprint profile...');
    const profileData = {
      userId: userRecord.uid,
      initialWaterprint: 1000,
      currentWaterprint: 1000,
      initialAssessment: {
        answers: [
          { questionId: '1', answer: 'yes', isCorrect: true },
          { questionId: '2', answer: 'no', isCorrect: false }
        ],
        correctAnswersCount: 1,
        date: admin.firestore.Timestamp.now()
      },
      completedTasks: [],
      progressHistory: [{
        date: admin.firestore.Timestamp.now(),
        waterprint: 1000
      }]
    };

    const profileRef = await admin.firestore()
      .collection('WaterprintProfiles')
      .add(profileData);
    
    console.log('Successfully created test profile:', profileRef.id);

    // Test profile retrieval
    console.log('\nRetrieving test profile...');
    const profileSnapshot = await admin.firestore()
      .collection('WaterprintProfiles')
      .where('userId', '==', userRecord.uid)
      .limit(1)
      .get();

    if (!profileSnapshot.empty) {
      const profile = profileSnapshot.docs[0].data();
      console.log('Successfully retrieved profile:', profile);
    }

    // Test profile update
    console.log('\nUpdating test profile...');
    const newWaterprint = 900;
    await profileRef.update({
      currentWaterprint: newWaterprint,
      completedTasks: admin.firestore.FieldValue.arrayUnion({
        taskId: 'task1',
        waterprintReduction: 100,
        completionDate: admin.firestore.Timestamp.now()
      })
    });

    console.log('Successfully updated profile');

    // Clean up (optional - commented out to keep test data)
    /*
    console.log('\nCleaning up test data...');
    await admin.auth().deleteUser(userRecord.uid);
    await profileRef.delete();
    console.log('Successfully cleaned up test data');
    */

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    process.exit();
  }
}

testFirebaseConnection(); 