import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../lib/firebase';
import {
  ANDROID_REQUESTS_COLLECTION,
  ANDROID_REQUEST_ORGANIZATION,
  normalizeEmail,
  normalizeName,
  requestDocId,
} from '../../../lib/androidRequests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Herkese açık: /download sayfasındaki Android kapalı test başvurusu.
 * Body: { name, email, company? }  — `company` honeypot'tur; doluysa kayıt yapılmaz.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Geçersiz istek' }, { status: 400 });
  }

  // Bot: sessizce başarılı gibi davran.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const name = normalizeName(body.name);
  const email = normalizeEmail(body.email);
  if (!name || !email) {
    return NextResponse.json({ message: 'Ad ve geçerli bir e-posta gerekli' }, { status: 400 });
  }

  try {
    const db = firebaseAdmin.firestore();
    const ref = db.collection(ANDROID_REQUESTS_COLLECTION).doc(requestDocId(email));
    const now = firebaseAdmin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) {
        tx.update(ref, { name, updatedAt: now });
      } else {
        tx.set(ref, {
          name,
          email,
          organization: ANDROID_REQUEST_ORGANIZATION,
          status: 'new',
          createdAt: now,
          updatedAt: now,
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Android request save failed:', error);
    return NextResponse.json({ message: 'Başvuru kaydedilemedi' }, { status: 500 });
  }
}
