import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../lib/adminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authenticated = verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return NextResponse.json({ authenticated });
}
