/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
    // Ensure SWC is used for compilation
    swcPlugins: [],
    // Ensure we're using the most stable features
    serverActions: true,
  },
  // Explicitly set compiler options
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: false,
  }
};

export default nextConfig;
