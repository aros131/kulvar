// src/lib/firebaseAdmin.ts
import "server-only";
import admin from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;

if (!admin.apps.length) {
  if (projectId && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    admin.initializeApp();
  }
}

export const adminDb = admin.firestore();
