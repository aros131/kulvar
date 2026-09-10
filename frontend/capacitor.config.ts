import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kulvar.app',
  appName: 'Kulvar',
  webDir: 'public',
  server: {
    // Dev: point at the local Next.js dev server (Simulator can reach your Mac's LAN IP).
    // Before an App Store build, replace this with the real production URL
    // (persecoaching.com won't work until the waitlist page there is replaced by the app).
    url: 'http://localhost:3000',
    cleartext: true,
  },
};

export default config;
