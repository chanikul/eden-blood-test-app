/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Use static export instead of standalone
  distDir: 'out', // Output to the 'out' directory
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
    serverActions: true,
  },
  swcMinify: true,
  images: {
    unoptimized: true, // Required for static export
    domains: ['eden-clinic-blood-test-app.windsurf.build'],
  },
  // Add trailing slash to help with routing
  trailingSlash: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Add src alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    return config;
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['localhost', 'edenclinic.netlify.app'],
  },
};

module.exports = nextConfig;
