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

module.exports = nextConfig;
