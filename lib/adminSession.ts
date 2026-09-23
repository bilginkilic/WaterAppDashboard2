import { createHmac, timingSafeEqual } from 'crypto';

// -----------------------------------------------------------------------------
// Admin oturumu (server-only)
// Giriş bilgileri ve imza anahtarı sadece Netlify env'de durur:
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET (en az 32 karakter)
// Oturum, httpOnly bir çerezde "<bitiş-ms>.<hmac>" olarak tutulur.
// -----------------------------------------------------------------------------

export const ADMIN_SESSION_COOKIE = 'wa_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && getSecret());
}

function safeEqual(a: string, b: string): boolean {
  // Uzunluk farkını sızdırmamak için önce sabit uzunlukta özetlere indir.
  const ha = createHmac('sha256', 'cmp').update(a).digest();
  const hb = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminSessionToken(now = Date.now()): string {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const expiresAt = String(now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null, now = Date.now()): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= now) return false;
  return safeEqual(signature, sign(expiresAt, secret));
}
