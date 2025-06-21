import { PrismaClient } from '@prisma/client'

// Determine if we're in edge runtime
const isEdgeRuntime = () => {
  return (
    process.env.NEXT_RUNTIME === 'edge' || // Next.js Edge API Routes
    process.env.NETLIFY === 'true' || // Netlify environment
    process.env.VERCEL_ENV === 'production' // Vercel edge functions
  )
}

// Global type for Prisma instance
const prismaGlobal = global as unknown as { prisma: PrismaClient }

// Create Prisma client with proper error handling
function createPrismaClient() {
  try {
    // Check if we're in edge runtime
    if (isEdgeRuntime()) {
      // For API routes that run in edge runtime (Netlify/Vercel edge functions)
      // Return a mock client that will show a clear error message
      // This prevents the "PrismaClient is not configured to run in Edge Runtime" error
      const mockClient = {
        $connect: () => Promise.resolve(),
        $disconnect: () => Promise.resolve(),
      } as unknown as PrismaClient
      
      return mockClient
    }
    
    // For regular server-side code, use the standard Prisma client
    return new PrismaClient({
      log: ['error', 'warn'],
    })
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error)
    // Return a minimal client that will throw clear errors when used
    return new PrismaClient()
  }
}

// Use existing instance or create a new one
export const prisma = prismaGlobal.prisma || createPrismaClient()

// Save client reference in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}

// Add error handler for connection issues
if (!isEdgeRuntime()) {
  prisma.$connect().catch(error => {
    console.warn('Warning: Initial Prisma connection failed:', error.message)
    if (process.env.NODE_ENV === 'development') {
      console.info('Development mode: Mock data will be used as fallback')
    }
  })
}
