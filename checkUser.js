const admin = require('firebase-admin');
const serviceAccount = require('./api/src/config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function checkUser() {
  try {
    const userRecord = await admin.auth().getUserByEmail('blgnklc@gmail.com');
    console.log('User found:', userRecord.toJSON());
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

checkUser(); 