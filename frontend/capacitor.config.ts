import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kulvar.app',
  appName: 'PerSe Coaching',
  webDir: 'public',
  server: {
    // Dev: point at the local Next.js dev server (Simulator/device reach your
    // Mac's LAN IP). BEFORE building for TestFlight/App Store, switch this to
    // 'https://kulvar-9kz2.vercel.app' (not persecoaching.com — that custom
    // domain still redirects to the waitlist page, see next.config.js) and
    // drop `cleartext` — a real tester can't reach your LAN IP.
    url: 'http://192.168.16.123:3000',
    cleartext: true,
  },
};

export default config;
