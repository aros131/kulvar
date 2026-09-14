const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Don't fail production builds because of ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Don't fail builds because of TS type errors
    ignoreBuildErrors: true,
  },
  images: {
    // Profile pictures / progress photos come from Firebase Storage or the
    // backend's own host, which changes across dev (LAN IP), prod (Render)
    // and previews. Rather than whitelisting every possible remote hostname,
    // skip Next's image optimizer so <Image> just renders the URL directly.
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'persecoaching.com' }],
        destination: '/perse',
        permanent: false,
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'www.persecoaching.com' }],
        destination: '/perse',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // "/perse" is a static file at public/perse/index.html. Next.js only
    // serves public/ assets at their literal path, so a bare "/perse"
    // request would otherwise 404 — this rewrite makes "/perse" itself
    // serve that file's content, without the URL bar changing.
    return [
      {
        source: '/perse',
        destination: '/perse/index.html',
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
