import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Log database URL hostname (redacted for security)
    const dbUrl = process.env.DATABASE_URL || '';
    const hostname = new URL(dbUrl).hostname;
    console.log('Database hostname:', hostname);
    
    // Test connection with a simple query
    const adminCount = await prisma.admin.count();
    console.log('Connection successful! Number of admin records:', adminCount);
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
