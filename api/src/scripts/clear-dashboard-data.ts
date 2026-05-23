/**
 * Deletes all dashboard-related Firestore data and Firebase Auth users.
 * Usage: npx ts-node src/scripts/clear-dashboard-data.ts
 */
import '../load-env';
import { admin } from '../config/firebase';

async function deleteCollection(collectionName: string): Promise<number> {
  const db = admin.firestore();
  const snap = await db.collection(collectionName).get();
  if (snap.empty) {
    return 0;
  }

  const batchSize = 400;
  let deleted = 0;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, docs.length - i);
  }

  return deleted;
}

async function deleteAllAuthUsers(): Promise<number> {
  let deleted = 0;
  let pageToken: string | undefined;

  do {
    const list = await admin.auth().listUsers(1000, pageToken);
    if (list.users.length === 0) {
      break;
    }
    const result = await admin.auth().deleteUsers(list.users.map((u) => u.uid));
    deleted += result.successCount;
    pageToken = list.pageToken;
  } while (pageToken);

  return deleted;
}

async function main() {
  console.log('Clearing dashboard data...\n');

  const profilesDeleted = await deleteCollection('WaterprintProfiles');
  console.log(`  WaterprintProfiles: ${profilesDeleted} deleted`);

  const usersDeleted = await deleteCollection('users');
  console.log(`  users: ${usersDeleted} deleted`);

  const authDeleted = await deleteAllAuthUsers();
  console.log(`  Firebase Auth users: ${authDeleted} deleted`);

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Clear failed:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
