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
  webpack: (config) => {
    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    return config;
  }
};

export default nextConfig;
