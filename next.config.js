/** @type {import('next').NextConfig} */
const path = require('path');

// Check if we're in production mode
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
    serverActions: true,
  },
  swcMinify: true,
  // Configure images for Vercel deployment
  images: {
    domains: [
      'eden-clinic-blood-test-app.windsurf.build', 
      'edenclinicformen.com', 
      'dlzfhnnwyvddaoikrung.supabase.co', 
      'vercel.app', 
      'eden-blood-test-app.vercel.app',
      'localhost',
      'edenclinic.netlify.app',
      'supabase.co',
      'supabase.in'
    ],
    unoptimized: false, // Changed to false to enable Next.js image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Add trailing slash to help with routing
  trailingSlash: true,
  // Remove asset prefix for Vercel deployment
  assetPrefix: '',
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
  // Add Content Security Policy headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self' https://*.vercel.app https://vercel.app;
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com https://js.stripe.com https://checkout.stripe.com https://hcaptcha.com https://*.hcaptcha.com https://*.vercel.app https://vercel.app;
              style-src 'self' 'unsafe-inline' https://*.googleapis.com https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com https://*.vercel.app https://vercel.app;
              style-src-elem 'self' 'unsafe-inline' https://*.googleapis.com https://fonts.googleapis.com https://hcaptcha.com https://*.hcaptcha.com https://*.vercel.app https://vercel.app;
              img-src 'self' blob: data: https://*.supabase.co https://*.supabase.in https://eden-clinic-blood-test-app.windsurf.build https://edenclinicformen.com https://dlzfhnnwyvddaoikrung.supabase.co https://localhost:* https://edenclinic.netlify.app https://*.googleapis.com https://*.gstatic.com https://*.google.com https://maps.gstatic.com https://*.stripe.com https://*.vercel.app https://vercel.app;
              font-src 'self' https://*.gstatic.com https://fonts.googleapis.com https://fonts.gstatic.com;
              connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.stripe.com https://eden-clinic-blood-test-app.windsurf.build https://edenclinicformen.com https://dlzfhnnwyvddaoikrung.supabase.co https://localhost:* https://edenclinic.netlify.app https://*.googleapis.com https://maps.googleapis.com https://*.google.com https://csp.withgoogle.com https://*.hcaptcha.com https://*.vercel.app https://vercel.app;
              frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://www.google.com https://hcaptcha.com https://*.hcaptcha.com https://vercel.live https://*.vercel.live https://*.vercel.app https://vercel.app;
              object-src 'none';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ];
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
  // Removed duplicate images config
};

module.exports = nextConfig;
