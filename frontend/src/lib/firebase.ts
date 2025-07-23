// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Your config (safe to use on client)
const firebaseConfig = {
  apiKey: "AIzaSyBqblbrETRgYJpX3UDNhRw2ET1SEJl3260",
  authDomain: "persecoaching.firebaseapp.com",
  projectId: "persecoaching",
  storageBucket: "persecoaching.firebasestorage.app",
  messagingSenderId: "697895669524",
  appId: "1:697895669524:web:967cc6821f6fef20a53c01",
};

// ✅ Prevent duplicate app init during hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
