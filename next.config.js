/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // COMMENT THIS OUT for Vercel; uncomment ONLY for local Android builds
  images: { unoptimized: true },
  reactStrictMode: true,
};

module.exports = nextConfig;