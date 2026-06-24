/**
 * firebase.js
 *
 * Firebase web-config. Deze waarden zijn GEEN geheim — het is client-config
 * en mag in de repo staan. Beveiliging regel je via Firestore security rules.
 */
 
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
 
const firebaseConfig = {
  apiKey:            "AIzaSyBrCxcwAhkddiYjvkTmGUEnOfBlddi5xgw",
  authDomain:        "dienstplanning-2aabc.firebaseapp.com",
  projectId:         "dienstplanning-2aabc",
  storageBucket:     "dienstplanning-2aabc.firebasestorage.app",
  messagingSenderId: "211304240402",
  appId:             "1:211304240402:web:a8d9baf76b356274e28fcb",
};
 
export const firebaseReady = !String(firebaseConfig.apiKey).startsWith("PLAK_HIER");
 
let db = null;
if (firebaseReady) {
  try {
    db = getFirestore(initializeApp(firebaseConfig));
  } catch (e) {
    console.error("Firebase-init mislukt:", e);
  }
}
 
export { db };
 