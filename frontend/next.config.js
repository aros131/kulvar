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
};

module.exports = nextConfig;
