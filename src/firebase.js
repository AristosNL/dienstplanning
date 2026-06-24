/**
 * firebase.js
 *
 * Waarden komen uit omgevingsvariabelen (VITE_FIREBASE_*).
 * Lokaal: maak een .env.local aan in de projectroot (zie README).
 * Netlify: stel de variabelen in via Site configuration → Environment variables.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
if (firebaseReady) {
  try {
    db = getFirestore(initializeApp(firebaseConfig));
  } catch (e) {
    console.error("Firebase-init mislukt:", e);
  }
}

export { db };
