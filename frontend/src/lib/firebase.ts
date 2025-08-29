// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBqblbrETRgYJpX3UDNhRw2ET1SEJl3260",
  authDomain: "persecoaching.firebaseapp.com",
  projectId: "persecoaching",
  storageBucket: "persecoaching.appspot.com", // <-- ✅ full domain
  messagingSenderId: "697895669524",
  appId: "1:697895669524:web:967cc6821f6fef20a53c01",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exports
export const db = getFirestore(app);
// You can also force the bucket explicitly if you prefer:
// export const storage = getStorage(app, "gs://persecoaching.appspot.com");
export const storage = getStorage(app);
export const auth = getAuth(app);

// Persist auth across reloads (client-side)
setPersistence(auth, browserLocalPersistence).catch(() => {});
