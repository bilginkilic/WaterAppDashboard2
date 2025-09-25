import { firebaseAdmin } from './config/firebase';

async function getStatistics() {
  try {
    // Get all users from Firebase
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users;
    console.log('Total users:', users.length);
    
    // Calculate active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = users.filter(user => {
      const lastSignIn = user.metadata.lastSignInTime 
        ? new Date(user.metadata.lastSignInTime) 
        : null;
      return lastSignIn && lastSignIn > thirtyDaysAgo;
    }).length;
    console.log('Active users:', activeUsers);

    // Get waterprint data
    const waterprintSnapshot = await firebaseAdmin.firestore()
      .collection('WaterprintProfiles')
      .get();

    const waterprints = waterprintSnapshot.docs.map(doc => doc.data());
    console.log('Total waterprints:', waterprints.length);
    
    // Calculate average water usage
    const averageWaterUsage = waterprints.length > 0
      ? Math.round(waterprints.reduce((acc, curr) => acc + (curr.currentWaterprint || 0), 0) / waterprints.length)
      : 0;
    console.log('Average water usage:', averageWaterUsage);

    // Calculate total water saved
    const totalWaterSaved = waterprints.reduce((acc, curr) => {
      const initial = curr.initialWaterprint || 0;
      const current = curr.currentWaterprint || 0;
      return acc + (initial - current > 0 ? initial - current : 0);
    }, 0);
    console.log('Total water saved:', Math.round(totalWaterSaved));

    const stats = {
      totalUsers: users.length,
      activeUsers,
      averageWaterUsage,
      totalWaterSaved: Math.round(totalWaterSaved),
    };

    console.log('\nFinal Statistics:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
}

getStatistics(); 