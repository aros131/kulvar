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
};

module.exports = nextConfig;
