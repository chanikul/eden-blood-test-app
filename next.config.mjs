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
  output: 'standalone'
};

export default nextConfig;
