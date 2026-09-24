import { createHash } from 'crypto';

// Android kapalı test başvuruları (Firestore `androidTesterRequests`).
export const ANDROID_REQUESTS_COLLECTION = 'androidTesterRequests';
// /download sayfasından gelen herkes bu kuruma etiketlenir.
export const ANDROID_REQUEST_ORGANIZATION = 'MUFG Turkey';

export const ANDROID_REQUEST_STATUSES = ['new', 'added'] as const;
export type AndroidRequestStatus = (typeof ANDROID_REQUEST_STATUSES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

export function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length >= 2 && name.length <= 100 ? name : null;
}

/** Aynı e-posta ikinci kez gelirse yeni kayıt yerine aynı doküman güncellenir. */
export function requestDocId(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 32);
}
