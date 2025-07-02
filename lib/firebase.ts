import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Admin SDK konfigürasyonu
if (!admin.apps.length) {
  try {
    // Eğer service account bilgileri varsa kullan
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // API key ile alternatif konfigürasyon
      console.log('Service account bilgileri bulunamadı, API key kullanılıyor...');
      admin.initializeApp({
        projectId: 'waterapp-dashboard', // Firebase proje ID'si
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (error) {
    console.log('Firebase admin initialization error', error);
  }
}

export const firebaseAdmin = admin;

// Firebase Web SDK konfigürasyonu
export const firebaseConfig = {
  apiKey: "AIzaSyA9Xg7h6XJeGiIdzd9i9hLKL4ISBNRLwNE",
  authDomain: "waterapp-dashboard-2.firebaseapp.com",
  projectId: "waterapp-dashboard-2",
  storageBucket: "waterapp-dashboard-2.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Firebase Web SDK uygulamasını başlat
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 