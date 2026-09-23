import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '../../../../../lib/firebase';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../../lib/adminSession';
import { isOrganization } from '../../../../../lib/organizations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Kullanıcıların kurum etiketini ayarlar.
 * Body: { userIds: string[], organization: "MUFG Turkey" | "MUFG London" | null }
 * null etiketi kaldırır.
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
  }

  let userIds: string[] = [];
  let organization: unknown;
  try {
    const body = await request.json();
    userIds = Array.isArray(body?.userIds)
      ? body.userIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];
    organization = body?.organization;
  } catch {
    return NextResponse.json({ message: 'Geçersiz istek' }, { status: 400 });
  }

  if (userIds.length === 0 || userIds.length > 500) {
    return NextResponse.json({ message: 'userIds 1-500 arası olmalı' }, { status: 400 });
  }
  if (organization !== null && !isOrganization(organization)) {
    return NextResponse.json({ message: 'Geçersiz kurum' }, { status: 400 });
  }

  try {
    const db = firebaseAdmin.firestore();
    const batch = db.batch();
    const value = organization === null ? firebaseAdmin.firestore.FieldValue.delete() : organization;
    userIds.forEach((id) => {
      batch.set(db.collection('users').doc(id), { organization: value }, { merge: true });
    });
    await batch.commit();
    return NextResponse.json({ ok: true, updated: userIds.length });
  } catch (error) {
    console.error('Organization update failed:', error);
    return NextResponse.json({ message: 'Kurum güncellenemedi' }, { status: 500 });
  }
}
