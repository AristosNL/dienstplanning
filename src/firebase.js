/**
 * firebase.js — init voor Firestore + Authentication
 *
 * Waarden komen uit omgevingsvariabelen (VITE_FIREBASE_*).
 * Lokaal: .env.local in de projectroot. Netlify: Environment variables.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = !!firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("undefined");

let db = null;
let auth = null;
if (firebaseReady) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase-init mislukt:", e);
  }
}

export { db, auth };
