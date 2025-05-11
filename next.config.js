/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  staticPageGenerationTimeout: 300,
  experimental: {
    workerThreads: true,
    optimizeCss: true
  },
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return config;
  },
};

module.exports = nextConfig;
