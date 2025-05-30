import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkBloodTests() {
  const prisma = new PrismaClient();
  
  try {
    // Log database URL hostname (redacted for security)
    const dbUrl = process.env.DATABASE_URL || '';
    const hostname = new URL(dbUrl).hostname;
    console.log('Database hostname:', hostname);
    
    // Test connection and check blood tests
    const count = await prisma.bloodTest.count();
    console.log('Number of blood tests:', count);
    
    if (count === 0) {
      console.log('No blood tests found. Checking schema...');
      const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
      console.log('Available tables:', tables);
    } else {
      const tests = await prisma.bloodTest.findMany();
      console.log('Blood tests:', tests);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBloodTests();
