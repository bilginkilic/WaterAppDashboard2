import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../../lib/firebase';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../../lib/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Kullanıcının challenge verisini sıfırlar: anket/su ayak izi profilleri
 * (WaterprintProfiles) ve eski `waterprints` kayıtları silinir.
 * Hesap, `users/{uid}` dokümanı ve kurum etiketi korunur.
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
  }

  let userId = '';
  try {
    const body = await request.json();
    userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  } catch {
    return NextResponse.json({ message: 'Geçersiz istek' }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ message: 'userId gerekli' }, { status: 400 });
  }

  try {
    const db = firebaseAdmin.firestore();
    const [profiles, legacy] = await Promise.all([
      db.collection('WaterprintProfiles').where('userId', '==', userId).get(),
      db.collection('waterprints').where('userId', '==', userId).get(),
    ]);
    const docs = [...profiles.docs, ...legacy.docs];
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return NextResponse.json({
      ok: true,
      deleted: { waterprintProfiles: profiles.size, waterprints: legacy.size },
    });
  } catch (error) {
    console.error('User data reset failed:', error);
    return NextResponse.json({ message: 'Kullanıcı verisi sıfırlanamadı' }, { status: 500 });
  }
}
