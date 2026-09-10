import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Mints Firebase Auth custom tokens so the frontend can sign into Firebase
// (Firestore chat, Storage uploads) using the same identity as our own JWT,
// instead of calling Firestore/Storage unauthenticated.
//
// Needs three env vars, from Firebase Console -> Project Settings ->
// Service Accounts -> Generate new private key:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (paste the "private_key" value; keep the \n escapes as-is)

let app = null;

function getFirebaseAdminApp() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env'
    );
  }

  app = getApps()[0] || initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return app;
}

export async function mintFirebaseCustomToken(userId, claims = {}) {
  const firebaseApp = getFirebaseAdminApp();
  return getAuth(firebaseApp).createCustomToken(String(userId), claims);
}

// Best-effort web push via FCM. Errors (missing config, expired token, etc.)
// are the caller's responsibility to swallow — push is a progressive
// enhancement, never something a notification flow should fail over.
export async function sendPushNotification(fcmToken, { title, body }) {
  const firebaseApp = getFirebaseAdminApp();
  await getMessaging(firebaseApp).send({
    token: fcmToken,
    notification: { title, body },
  });
}
