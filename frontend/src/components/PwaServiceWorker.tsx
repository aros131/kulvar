"use client";

import { useEffect } from "react";

// Registers the service worker unconditionally on every page load, independent
// of login state or notification permission. Chrome's "Install app" prompt in
// the address bar requires an active service worker controlling the page —
// previously this only registered inside registerPushNotifications() (login.tsx
// signup.tsx), which also required the user to grant notification permission
// first, so a first-time or logged-out visitor never got the install prompt.
export default function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
  }, []);

  return null;
}
