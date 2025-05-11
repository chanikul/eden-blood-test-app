import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:.*@/, ':****@'));
    
    // Test connection
    await prisma.$connect();
    console.log('Successfully connected to database!');
    
    // Try a simple query
    const testQuery = await prisma.$queryRaw`SELECT current_timestamp;`;
    console.log('Test query result:', testQuery);
    
  } catch (error) {
    console.error('Database connection test failed:');
    console.error(error);
    
    if (error instanceof Error) {
      // Check for common connection issues
      if (error.message.includes("Can't reach database server")) {
        console.error('\nPossible issues:');
        console.error('1. Database server is not running');
        console.error('2. Network connectivity issues');
        console.error('3. Firewall blocking connection');
        console.error('4. Incorrect database credentials');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
