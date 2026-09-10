importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Firebase web config is not a secret (it identifies the project, not an
// auth credential), so it's safe to inline here — service workers can't
// read Next.js env vars at runtime.
firebase.initializeApp({
  apiKey: "AIzaSyBqblbrETRgYJpX3UDNhRw2ET1SEJl3260",
  authDomain: "persecoaching.firebaseapp.com",
  projectId: "persecoaching",
  storageBucket: "persecoaching.firebasestorage.app",
  messagingSenderId: "697895669524",
  appId: "1:697895669524:web:967cc6821f6fef20a53c01",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Kulvar";
  const options = {
    body: payload.notification?.body,
    icon: "/icons/icon-192.png",
  };
  self.registration.showNotification(title, options);
});
