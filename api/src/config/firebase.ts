import * as admin from 'firebase-admin';
import axios from 'axios';
import { createFakeAdmin } from './fakeFirebase';

/* eslint-disable @typescript-eslint/no-explicit-any */
const useFake = process.env.WATERAPP_FAKE_FIREBASE === '1';

let adminImpl: typeof admin;
let fake: ReturnType<typeof createFakeAdmin> | null = null;

if (useFake) {
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    throw new Error('WATERAPP_FAKE_FIREBASE must not be used in production');
  }
  fake = createFakeAdmin();
  adminImpl = fake as any;
} else {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../../firebase-service-account-new.json');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  adminImpl = admin;
}

/** Test/e2e access to the in-memory store; null against real Firebase. */
export const fakeFirebase = fake?.__fake ?? null;

/**
 * Verifies an email/password pair and returns the Firebase uid, or null when the
 * credentials are wrong.
 */
export async function signInWithPassword(email: string, password: string): Promise<string | null> {
  if (fake) return fake.__fake.auth.signIn(email, password);

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('Firebase Web API Key is not configured');
  try {
    const { data } = await axios.post<{ localId?: string }>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      { email, password, returnSecureToken: true },
    );
    return data?.localId || null;
  } catch {
    return null;
  }
}

export { adminImpl as admin };
export const firebaseAdmin = adminImpl;
