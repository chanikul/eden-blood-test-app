/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  staticPageGenerationTimeout: 180,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    removeConsole: false,
  },
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  output: 'standalone',
  staticPageGenerationTimeout: 300,
  experimental: {
    serverActions: {
      enabled: true
    },
    workerThreads: true,
    optimizeCss: true
  },
  allowedDevOrigins: ['127.0.0.1', 'http://127.0.0.1:*'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
