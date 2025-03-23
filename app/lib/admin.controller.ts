import { firebaseAdmin } from '@/lib/firebase';

export async function getUsers() {
  try {
    const listUsersResult = await firebaseAdmin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      id: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime || null,
    }));
    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    throw new Error('Kullanıcı listesi alınamadı');
  }
} 