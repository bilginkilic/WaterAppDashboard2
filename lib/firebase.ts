import * as admin from 'firebase-admin';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/** Netlify / Vercel secret: çok satırlı PEM veya JSON'dan gelen `\n` kaçışları */
function normalizePrivateKey(raw: string): string {
  let k = raw.trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1);
  }
  return k.replace(/\\n/g, '\n');
}

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function tryParseServiceAccountJson(
  value: string | undefined
): ServiceAccountJson | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as ServiceAccountJson;
    if (parsed?.private_key && parsed?.client_email) return parsed;
  } catch {
    /* not JSON */
  }
  return null;
}

// -----------------------------------------------------------------------------
// Firebase Admin (server-only) — lazy init
// Build zamanında (Next.js "Collecting page data") modül import edildiğinde
// initializeApp çağrılırsa ve env yoksa build çöker. Bu yüzden ilk kullanımda
// (handler içinde) init ediyoruz.
// Netlify: tek gizli değişkende tüm service account JSON için
// FIREBASE_SERVICE_ACCOUNT veya FIREBASE_SERVICE_ACCOUNT_JSON kullanılabilir.
// -----------------------------------------------------------------------------
function ensureAdminInitialized(): void {
  if (admin.apps.length > 0) return;
  try {
    const fromJson =
      tryParseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT) ??
      tryParseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    if (fromJson?.private_key && fromJson.client_email) {
      const projectId =
        fromJson.project_id ??
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new Error(
          'Service account JSON has no project_id; set FIREBASE_PROJECT_ID in env.'
        );
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: fromJson.client_email,
          privateKey: normalizePrivateKey(fromJson.private_key),
        }),
      });
      return;
    }

    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        }),
      });
      return;
    }

    // Google Cloud ortamlarında (GOOGLE_APPLICATION_CREDENTIALS set ise) fallback.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId:
          process.env.FIREBASE_PROJECT_ID ??
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      return;
    }

    // Credential yoksa init etme; runtime'da fırlatalım ki anlaşılabilir hata dönsün.
    throw new Error(
      'Firebase Admin credentials missing. Set either FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
    );
  } catch (error) {
    console.error('[firebase-admin] initialization error:', error);
    throw error;
  }
}

export const firebaseAdmin = new Proxy(admin, {
  get(target, prop, receiver) {
    ensureAdminInitialized();
    return Reflect.get(target, prop, receiver);
  },
}) as typeof admin;

// -----------------------------------------------------------------------------
// Firebase Web SDK — lazy init
// -----------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

function getWebApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  if (!firebaseConfig.apiKey) {
    throw new Error(
      'NEXT_PUBLIC_FIREBASE_API_KEY is missing. Set the NEXT_PUBLIC_FIREBASE_* env vars.'
    );
  }
  return initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getWebApp());
}

export function getClientFirestore(): Firestore {
  return getFirestore(getWebApp());
}

// Geriye dönük uyumluluk: `auth` ve `db` isimleriyle import edilen yerler,
// erişim anında tembel şekilde gerçek nesneyi alır.
export const auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getClientAuth() as object, prop, receiver);
  },
}) as Auth;

export const db = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    return Reflect.get(getClientFirestore() as object, prop, receiver);
  },
}) as Firestore;
