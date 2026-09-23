/**
 * Kullanıcılara kurum etiketi verir (Firestore `users/{uid}.organization`).
 *
 * - --emails dosyasındaki e-postalara sahip kullanıcılar → --org değeri
 * - --rest verilirse, etiketi olmayan diğer tüm kullanıcılar → --rest değeri
 *
 * Varsayılan olarak sadece ne yapacağını yazdırır; yazmak için --apply ekleyin.
 *
 * Usage:
 *   npx ts-node src/scripts/set-organization.ts \
 *     --emails turkey-emails.txt --org "MUFG Turkey" --rest "MUFG London" [--apply]
 */
import '../load-env';
import { readFileSync } from 'fs';
import { admin } from '../config/firebase';

const ORGANIZATIONS = ['MUFG Turkey', 'MUFG London'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function listAllAuthUsers() {
  const users: admin.auth.UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

async function main() {
  const emailsFile = arg('emails');
  const org = arg('org');
  const rest = arg('rest');
  const apply = process.argv.includes('--apply');

  if (!emailsFile || !org) {
    throw new Error('Usage: --emails <file> --org <organization> [--rest <organization>] [--apply]');
  }
  for (const value of [org, rest]) {
    if (value && !ORGANIZATIONS.includes(value)) {
      throw new Error(`Unknown organization "${value}". Allowed: ${ORGANIZATIONS.join(', ')}`);
    }
  }

  const targetEmails = new Set(
    readFileSync(emailsFile, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean)
  );

  const db = admin.firestore();
  const usersSnap = await db.collection('users').get();
  const docs = new Map(usersSnap.docs.map((d) => [d.id, d.data() as { email?: string; organization?: string }]));
  const authUsers = await listAllAuthUsers();

  // uid → e-posta (Firestore users dokümanları + Firebase Auth)
  const emailByUid = new Map<string, string>();
  docs.forEach((d, uid) => emailByUid.set(uid, (d.email || '').trim().toLowerCase()));
  authUsers.forEach((u) => {
    if (!emailByUid.get(u.uid)) emailByUid.set(u.uid, (u.email || '').trim().toLowerCase());
  });

  const updates: { uid: string; email: string; from: string | null; to: string }[] = [];
  const matchedEmails = new Set<string>();
  emailByUid.forEach((email, uid) => {
    const current = docs.get(uid)?.organization ?? null;
    let next: string | null = null;
    if (email && targetEmails.has(email)) {
      next = org;
      matchedEmails.add(email);
    } else if (rest && !current) {
      next = rest;
    }
    if (next && next !== current) updates.push({ uid, email: email || '(no email)', from: current, to: next });
  });

  updates.forEach((u) => console.log(`${u.to.padEnd(12)} ← ${u.email} (${u.from ?? 'untagged'})`));
  const missing = [...targetEmails].filter((e) => !matchedEmails.has(e));
  console.log(`\n${updates.length} user(s) to update.`);
  if (missing.length) console.log(`Not found in Firebase: ${missing.join(', ')}`);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write.');
    return;
  }

  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    updates.slice(i, i + 400).forEach((u) => {
      batch.set(db.collection('users').doc(u.uid), { organization: u.to }, { merge: true });
    });
    await batch.commit();
  }
  console.log(`\nWrote ${updates.length} update(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
