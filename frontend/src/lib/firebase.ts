// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Your config with correct storageBucket
const firebaseConfig = {
  apiKey: "AIzaSyBqblbrETRgYJpX3UDNhRw2ET1SEJl3260",
  authDomain: "persecoaching.firebaseapp.com",
  projectId: "persecoaching",
  storageBucket: "persecoaching.appspot.com", // ✅ Fix here
  messagingSenderId: "697895669524",
  appId: "1:697895669524:web:967cc6821f6fef20a53c01",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
