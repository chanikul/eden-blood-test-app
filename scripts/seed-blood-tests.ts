import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First, let's check if we have any blood tests
    const count = await prisma.bloodTest.count();
    console.log(`Current blood test count: ${count}`);

    if (count === 0) {
      // Create a sample blood test
      const test = await prisma.bloodTest.create({
        data: {
          name: 'Complete Blood Count (CBC)',
          slug: 'complete-blood-count',
          description: 'A complete blood count (CBC) is a blood test used to evaluate your overall health and detect a wide range of disorders.',
          price: 99.99,
          isActive: true
        }
      });
      console.log('Created blood test:', test);
    } else {
      console.log('Blood tests already exist in the database');
      
      // List all blood tests
      const tests = await prisma.bloodTest.findMany();
      console.log('Existing blood tests:', tests);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
