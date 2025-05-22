import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('Starting database cleanup...');

  try {
    // Delete all orders first (due to foreign key constraints)
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} orders`);

    // Delete all blood tests
    const deletedTests = await prisma.bloodTest.deleteMany({});
    console.log(`Deleted ${deletedTests.count} blood tests`);

    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .catch((error) => {
    console.error('Failed to clean database:', error);
    process.exit(1);
  });
