import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Add trailing slash to improve routing compatibility
  trailingSlash: true,
  // Ensure output is compatible with Netlify
  output: 'standalone',
  // Explicitly configure path aliases
  webpack: (config, { isServer }) => {
    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    // Force all UI component imports to resolve correctly
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      'node_modules',
      ...config.resolve.modules || [],
    ];
    
    return config;
  },
  // Ensure transpilation of UI components
  transpilePackages: ['@/components']
};

export default nextConfig;
