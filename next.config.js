/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  swcMinify: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'edenclinic.netlify.app'],
    },
    serverComponentsExternalPackages: ['stripe'],
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
