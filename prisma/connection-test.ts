// Connection test script for Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test the connection
    const result = await prisma.$queryRaw`SELECT 1 as alive`;
    console.log('✅ Database connection successful:', result);
    
    // Try to fetch some blood tests
    const bloodTests = await prisma.bloodTest.findMany({
      take: 5
    });
    console.log(`✅ Successfully fetched ${bloodTests.length} blood tests:`);
    console.log(JSON.stringify(bloodTests, null, 2));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
