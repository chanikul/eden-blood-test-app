/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    removeConsole: false
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'edenclinic.netlify.app'],
    },
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };
    return config;
  },
  images: {
    domains: ['localhost', 'edenclinic.netlify.app'],
  },
};

module.exports = nextConfig;
