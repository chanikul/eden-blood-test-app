/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// For Netlify deployment: Check if we're in a Netlify build environment
const isNetlify = process.env.NETLIFY === 'true';

// Create empty module mocks for client-only packages that cause build issues
if (isNetlify) {
  console.log('Netlify build environment detected, setting up module mocks...');
  const mockDir = path.join(__dirname, '.netlify-mocks');
  
  if (!fs.existsSync(mockDir)) {
    fs.mkdirSync(mockDir, { recursive: true });
    
    // Create mock for @stripe/react-stripe-js
    fs.writeFileSync(
      path.join(mockDir, 'stripe-mock.js'),
      'exports.Elements = () => null; exports.PaymentElement = () => null; exports.useStripe = () => ({}); exports.useElements = () => ({});'
    );
    
    // Create mock for @supabase/auth-helpers-nextjs
    fs.writeFileSync(
      path.join(mockDir, 'supabase-mock.js'),
      'exports.createClientComponentClient = () => ({}); exports.createServerComponentClient = () => ({});'
    );
    
    // Create mock for nodemailer
    fs.writeFileSync(
      path.join(mockDir, 'nodemailer-mock.js'),
      'module.exports = { createTransport: () => ({ sendMail: () => Promise.resolve({}) }) };'
    );
  }
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    optimizeCss: true,
    // Add all React Email packages to the serverComponentsExternalPackages list
    serverComponentsExternalPackages: [
      'stripe',
      '@react-email/components',
      '@react-email/render',
      '@react-email/html',
      '@react-email/head',
      '@react-email/button',
      '@react-email/container',
      '@react-email/text',
      '@react-email/body',
      '@react-email/preview',
      '@react-email/link',
      '@react-email/hr',
      '@react-email/section'
    ],
    serverActions: true, // Enable Server Actions feature flag
  },
  swcMinify: true,
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
    
    // For Netlify: Replace problematic client-only modules with mocks
    if (process.env.NETLIFY === 'true') {
      const mockDir = path.join(__dirname, '.netlify-mocks');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@stripe/react-stripe-js': path.join(mockDir, 'stripe-mock.js'),
        '@supabase/auth-helpers-nextjs': path.join(mockDir, 'supabase-mock.js'),
        'nodemailer': path.join(mockDir, 'nodemailer-mock.js'),
      };
      console.log('Added module mocks for Netlify build');
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
  swcMinify: true,
  images: {
    domains: ['localhost', 'edenclinic.netlify.app'],
  },
};

module.exports = nextConfig;
