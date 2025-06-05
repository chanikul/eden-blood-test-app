/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Completely disable SWC
  swcMinify: false,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Disable experimental features that might rely on SWC
  experimental: {
    serverActions: true,
  },
  // Force Babel instead of SWC
  webpack: (config, { isServer }) => {
    // Use babel-loader for all JS/TS files
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: 'babel-loader',
      exclude: /node_modules/,
    });
    return config;
  }
};

export default nextConfig;
