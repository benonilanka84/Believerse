/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // ADD THIS LINE:
  eslint: { ignoreDuringBuilds: true }, 
  typescript: { ignoreBuildErrors: true },
}

module.exports = nextConfig