/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SWC minify to avoid dependency issues
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
    // Disable SWC plugins
    swcPlugins: [],
    // Keep server actions enabled
    serverActions: true,
  },
  // Disable SWC compiler
  compiler: {
    // Disable SWC transforms
    styledComponents: false,
  }
};

export default nextConfig;
