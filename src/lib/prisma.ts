import { PrismaClient } from '@prisma/client'

// Make sure we don't create multiple instances of Prisma in development
const prismaGlobal = global as unknown as { prisma: PrismaClient }

// Create a Prisma client with pgBouncer configuration for Supabase
export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Re-use connection between requests for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  })

// Test the connection and log status in development
if (process.env.NODE_ENV === 'development') {
  prisma.$queryRaw`SELECT 1 as connection_test`
    .then(() => {
      console.log('✅ Prisma connection to database successful')
    })
    .catch((error) => {
      console.error('❌ Prisma database connection error:', error)
    })
}

// Save reference to client in global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}
