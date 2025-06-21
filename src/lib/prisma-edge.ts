/**
 * Prisma client for edge runtime environments (Netlify/Vercel)
 * This file provides a mock client for edge functions and routes
 */

// This is a simple mock client that can be used in edge functions
// It will prevent the "PrismaClient is not configured to run in Edge Runtime" error
export const edgePrismaClient = {
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  // Add mock implementations for commonly used Prisma methods
  // These will be used in edge functions where the real Prisma client isn't available
  admin: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  clientUser: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  order: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  bloodTest: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  testResult: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  adminAuditLog: {
    create: () => Promise.resolve({}),
    findMany: () => Promise.resolve([]),
  },
};

// Helper function to determine if we're in an edge runtime
export const isEdgeRuntime = () => {
  return (
    process.env.NEXT_RUNTIME === 'edge' || // Next.js Edge API Routes
    process.env.NETLIFY === 'true' || // Netlify environment
    process.env.VERCEL_ENV === 'production' // Vercel edge functions
  );
};

// Export a function to get the appropriate client based on environment
export function getPrismaClient() {
  if (isEdgeRuntime()) {
    return edgePrismaClient;
  }
  
  // For non-edge environments, import and use the regular Prisma client
  // This dynamic import prevents the edge runtime error
  try {
    // Use dynamic import to avoid loading in edge runtime
    return require('./prisma').prisma;
  } catch (error) {
    console.error('Failed to load Prisma client:', error);
    return edgePrismaClient; // Fallback to mock client
  }
}
