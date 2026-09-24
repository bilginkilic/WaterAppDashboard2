import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../lib/firebase';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../lib/adminSession';
import { ANDROID_REQUESTS_COLLECTION, ANDROID_REQUEST_STATUSES } from '../../../../lib/androidRequests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdmin(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

function toIso(value: unknown): string | null {
  const ts = value as { toDate?: () => Date } | null;
  return ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : null;
}

/** Android kapalı test başvuruları, en yeni önce. */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
  }
  try {
    const snap = await firebaseAdmin.firestore().collection(ANDROID_REQUESTS_COLLECTION).get();
    const requests = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name ?? '',
          email: d.email ?? '',
          organization: d.organization ?? null,
          status: d.status === 'added' ? 'added' : 'new',
          createdAt: toIso(d.createdAt),
        };
      })
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Android requests list failed:', error);
    return NextResponse.json({ message: 'Başvurular alınamadı' }, { status: 500 });
  }
}

/** Body: { id, status: 'new' | 'added' } */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
  }
  let id: unknown;
  let status: unknown;
  try {
    ({ id, status } = await request.json());
  } catch {
    return NextResponse.json({ message: 'Geçersiz istek' }, { status: 400 });
  }
  if (typeof id !== 'string' || !id || !(ANDROID_REQUEST_STATUSES as readonly unknown[]).includes(status)) {
    return NextResponse.json({ message: 'Geçersiz istek' }, { status: 400 });
  }
  try {
    await firebaseAdmin.firestore().collection(ANDROID_REQUESTS_COLLECTION).doc(id).update({
      status,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Android request update failed:', error);
    return NextResponse.json({ message: 'Başvuru güncellenemedi' }, { status: 500 });
  }
}
