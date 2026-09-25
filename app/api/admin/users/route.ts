import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../lib/adminSession';
import { computeDashboardStats } from '../../../../lib/dashboardStats';
import {
  buildDashboardUser,
  dedupeUsersByEmail,
  indexProfilesByUserId,
  type UsersDoc,
  type WaterprintProfileDoc,
} from '../../../../lib/footprint';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const db = firebaseAdmin.firestore();

    // Load all waterprint profiles once and index by userId
    const profilesSnap = await db.collection('WaterprintProfiles').get();
    const profilesByUserId = indexProfilesByUserId(
      profilesSnap.docs.map((doc) => doc.data() as WaterprintProfileDoc)
    );

    // Collect users from Firestore `users` collection (primary source)
    const usersSnap = await db.collection('users').get();
    const usersById = new Map<string, UsersDoc>();
    usersSnap.forEach((doc) => {
      usersById.set(doc.id, doc.data() as UsersDoc);
    });

    // Also merge in any Firebase Auth users that aren't yet in Firestore
    try {
      const authList = await firebaseAdmin.auth().listUsers(1000);
      authList.users.forEach((u) => {
        if (!usersById.has(u.uid)) {
          usersById.set(u.uid, {
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            createdAt: u.metadata.creationTime ?? null,
            lastLoginAt: u.metadata.lastSignInTime ?? null,
          });
        } else {
          const existing = usersById.get(u.uid)!;
          usersById.set(u.uid, {
            ...existing,
            email: existing.email ?? u.email ?? null,
            displayName: existing.displayName ?? existing.name ?? u.displayName ?? null,
            lastLoginAt: existing.lastLoginAt ?? u.metadata.lastSignInTime ?? null,
            createdAt: existing.createdAt ?? u.metadata.creationTime ?? null,
          });
        }
      });
    } catch (err) {
      console.warn('auth().listUsers failed (continuing with Firestore users):', err);
    }

    const users = dedupeUsersByEmail(
      Array.from(usersById.entries()).map(([uid, u]) => buildDashboardUser(uid, u, profilesByUserId.get(uid)))
    );

    return NextResponse.json({ users, stats: computeDashboardStats(users) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error listing users:', error);
    const hint = /credentials missing|FIREBASE_SERVICE_ACCOUNT|private key|PEM|DECODER/i.test(
      msg
    )
      ? 'Netlify: set FIREBASE_SERVICE_ACCOUNT (entire service-account JSON) or the three env vars; ensure vars apply to Functions/runtime (not only build); multiline private key or \\n-escaped line breaks.'
      : /PERMISSION_DENIED|insufficient|does not have/i.test(msg)
        ? 'Firebase/GCP: service account için Firestore (ve gerekirse Auth) API erişimini kontrol edin.'
        : undefined;
    return NextResponse.json(
      { error: 'Kullanıcı listesi alınamadı', detail: msg, ...(hint && { hint }) },
      { status: 500 }
    );
  }
}
