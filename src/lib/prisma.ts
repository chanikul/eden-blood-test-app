import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  console.log('Initializing Prisma Client...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('Direct URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');
  
  const client = new PrismaClient({
    log: ['error', 'warn', 'info', 'query'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.NODE_ENV === 'production'
          ? process.env.DATABASE_URL
          : process.env.DIRECT_URL || process.env.DATABASE_URL
      }
    }
  });

  // Test the connection
  client.$connect()
    .then(() => console.log('Successfully connected to database'))
    .catch((error: Error) => console.error('Failed to connect to database:', error));

  return client;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
