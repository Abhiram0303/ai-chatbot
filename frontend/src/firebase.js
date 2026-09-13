import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

/**
 * Checks if Firebase configuration environment variables are properly supplied in frontend/.env
 */
export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey.trim() !== '' &&
  apiKey !== 'YOUR_API_KEY' &&
  projectId &&
  projectId.trim() !== '' &&
  projectId !== 'YOUR_PROJECT_ID'
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain ? authDomain.trim() : undefined,
      projectId: projectId.trim(),
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
} else {
  console.warn('⚠️ NOVA: Firebase configuration missing or empty in frontend/.env file.');
}

export { app, auth, db, googleProvider };
export default app;

