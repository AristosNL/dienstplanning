/**
 * netlify/functions/agenda.js
 *
 * Serveert /agenda/{staffId}.ics als een geldig .ics-bestand, live uitgelezen
 * uit Firestore (collectie "publicAgenda", document-id = staff.id).
 *
 * Leest bewust GEEN service-account: de publicAgenda-collectie is expliciet
 * publiek leesbaar gemaakt via Firestore-rules (zie setup-instructies),
 * dezelfde manier waarop de client-app al met Firestore praat.
 *
 * Benodigde Netlify environment variables (Site settings → Environment):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 * (Dezelfde waarden als voor de frontend-build — hergebruik ze gewoon.)
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

let app, db;
function getDb() {
  if (!db) {
    app = initializeApp({
      apiKey:            process.env.VITE_FIREBASE_API_KEY,
      authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.VITE_FIREBASE_APP_ID,
    });
    db = getFirestore(app);
  }
  return db;
}

export default async (req, context) => {
  // staffId komt uit de Netlify-redirect als :slug parameter, of query
  const url = new URL(req.url);
  let slug = context.params?.slug || url.searchParams.get("person") || "";
  slug = slug.replace(/\.ics$/i, "").toLowerCase().trim();

  if (!slug) {
    return new Response("Ontbrekende medewerker-id.", { status: 400 });
  }

  try {
    const snap = await getDoc(doc(getDb(), "publicAgenda", slug));
    if (!snap.exists()) {
      return new Response("Geen agenda gevonden voor deze medewerker.", { status: 404 });
    }
    const { ics } = snap.data();
    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=300",   // 5 min — agenda-apps pollen toch periodiek
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response("Kon agenda niet ophalen: " + e.message, { status: 500 });
  }
};

export const config = {
  path: "/.netlify/functions/agenda/:slug",
};
