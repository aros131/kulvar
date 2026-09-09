// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence, signInWithCustomToken } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBqblbrETRgYJpX3UDNhRw2ET1SEJl3260",
  authDomain: "persecoaching.firebaseapp.com",
  projectId: "persecoaching",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "persecoaching.firebasestorage.app",
  messagingSenderId: "697895669524",
  appId: "1:697895669524:web:967cc6821f6fef20a53c01",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exports
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Persist auth across reloads (client-side)
setPersistence(auth, browserLocalPersistence).catch(() => {});

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// Exchanges our own backend JWT for a Firebase custom token and signs into
// Firebase with it, so request.auth is populated for Firestore/Storage rules.
// Call this once right after a successful backend login/signup. Failures are
// swallowed on purpose — chat/uploads degrade, but login must never block on this.
export async function signInToFirebase(backendToken: string) {
  try {
    const res = await fetch(`${API}/auth/firebase-token`, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });
    if (!res.ok) throw new Error(`firebase-token request failed: ${res.status}`);
    const { token } = await res.json();
    await signInWithCustomToken(auth, token);
  } catch (err) {
    console.error("Firebase sign-in failed:", err);
  }
}
