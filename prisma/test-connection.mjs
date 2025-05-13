import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  try {
    const count = await prisma.bloodTest.count();
    console.log('Database connection successful!');
    console.log('Number of blood tests:', count);
  } catch (error) {
    console.error('Error connecting to database:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
