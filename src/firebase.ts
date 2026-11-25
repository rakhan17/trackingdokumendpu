import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web config is public client configuration.
// Keep environment overrides for local/alternate deployments, with the
// project's known config as a fallback so Vercel does not boot with undefined.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB3FUNcjEXZoaXGyERvkqmWSaPUVqaZsnI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trackingdokumenpu.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trackingdokumenpu',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trackingdokumenpu.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '869214425857',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:869214425857:web:aadd129ae63bca71c18100',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
