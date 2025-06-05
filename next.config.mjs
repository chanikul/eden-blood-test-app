/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  },
  // Add trailing slash to improve routing compatibility
  trailingSlash: true,
  // Ensure output is compatible with Netlify
  output: 'standalone'
};

export default nextConfig;
