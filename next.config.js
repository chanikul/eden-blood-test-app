/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  staticPageGenerationTimeout: 300,
  experimental: {
    serverActions: {
      enabled: true
    },
    workerThreads: true,
    optimizeCss: true
  },
  images: {
    domains: ['localhost', 'edenclinic.netlify.app'],
    unoptimized: true
  },
};

module.exports = nextConfig;
