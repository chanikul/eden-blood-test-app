/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enabled: true
    },
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  allowedDevOrigins: ['127.0.0.1', 'http://127.0.0.1:*'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
