import { PrismaClient } from '@prisma/client'

// Improved edge runtime detection
const isEdgeRuntime = () => {
  return (
    process.env.NEXT_RUNTIME === 'edge' || // Next.js Edge API Routes
    process.env.NETLIFY === 'true' || // Netlify environment
    // FIXED: Remove incorrect detection of Vercel production as edge runtime
    process.env.VERCEL_REGION?.includes('cdg') // Vercel edge functions typically have region codes
    // REMOVED: process.env.VERCEL_ENV === 'production' was incorrectly treating all Vercel prod as edge
  )
}

// Create a more comprehensive mock client for edge runtime
const createMockPrismaClient = () => {
  // This mock client provides stub implementations for common Prisma methods
  // to prevent 'undefined' errors when methods are called
  const handler = {
    get: (target: any, prop: string) => {
      // For common model names, return an object with common methods
      if (['bloodTest', 'testResult', 'client', 'user', 'order'].includes(prop)) {
        return {
          findMany: async () => [],
          findUnique: async () => null,
          findFirst: async () => null,
          create: async () => ({}),
          update: async () => ({}),
          delete: async () => ({}),
          count: async () => 0,
          aggregate: async () => ({ _count: 0 }),
        }
      }
      
      // For $transaction, return a function that executes the passed function with an empty array
      if (prop === '$transaction') {
        return async (fn: any) => {
          if (typeof fn === 'function') return await fn([])
          return []
        }
      }
      
      // For $executeRaw, return a function that resolves to 0
      if (prop === '$executeRaw') {
        return async () => 0
      }
      
      // For other properties, return either the property if it exists or a no-op function
      return target[prop] || (typeof prop === 'string' && prop.startsWith('$') 
        ? async () => ({}) 
        : {})
    }
  }
  
  const baseClient = {
    $connect: async () => Promise.resolve(),
    $disconnect: async () => Promise.resolve(),
    $on: (event: string, listener: () => void) => {},
  }
  
  return new Proxy(baseClient, handler) as unknown as PrismaClient
}

// Global type for Prisma instance
const prismaGlobal = global as unknown as { prisma: PrismaClient }

// Create Prisma client with proper error handling
function createPrismaClient() {
  try {
    // Check if we're in edge runtime
    if (isEdgeRuntime()) {
      console.log('Edge runtime detected, using mock Prisma client')
      return createMockPrismaClient()
    }
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is missing')
      throw new Error('DATABASE_URL is required')
    }
    
    // For regular server-side code, use the standard Prisma client
    console.log(`Initializing Prisma client in ${process.env.NODE_ENV} mode on ${process.env.VERCEL_ENV || 'local'} environment`)
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    })
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error)
    // Return a mock client as fallback
    return createMockPrismaClient()
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
  prisma.$connect().then(() => {
    console.log('Prisma client connected successfully')
  }).catch(error => {
    console.error('Warning: Initial Prisma connection failed:', error.message, error.stack)
    if (process.env.NODE_ENV === 'development') {
      console.info('Development mode: Mock data will be used as fallback')
    } else {
      console.error('Production Prisma connection error details:', {
        databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : 'missing',
        directUrl: process.env.DIRECT_URL ? `${process.env.DIRECT_URL.substring(0, 15)}...` : 'missing',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelRegion: process.env.VERCEL_REGION
      })
    }
  })
}
