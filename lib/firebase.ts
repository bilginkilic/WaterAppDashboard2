import * as admin from 'firebase-admin';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// -----------------------------------------------------------------------------
// Firebase Admin (server-only) — lazy init
// Build zamanında (Next.js "Collecting page data") modül import edildiğinde
// initializeApp çağrılırsa ve env yoksa build çöker. Bu yüzden ilk kullanımda
// (handler içinde) init ediyoruz.
// -----------------------------------------------------------------------------
function ensureAdminInitialized(): void {
  if (admin.apps.length > 0) return;
  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
      'Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars.'
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
