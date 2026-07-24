import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// All values come from environment variables — never hardcode credentials.
// FIREBASE_SERVICE_ACCOUNT should hold the full service-account JSON as a
// single-line string (set it as a Vercel env var).
function getApp() {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is missing. See .env.example."
    );
  }
  const serviceAccount = JSON.parse(raw);

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

export const db = getFirestore(getApp());
export const bucket = getStorage(getApp()).bucket();
