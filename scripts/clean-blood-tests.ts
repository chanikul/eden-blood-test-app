import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Cleaning database...');

  // First delete all orders
  console.log('Deleting orders...');
  const deleteOrdersResult = await prisma.order.deleteMany({});
  console.log(`Deleted ${deleteOrdersResult.count} orders`);

  // Then delete all blood tests
  console.log('\nDeleting blood tests...');
  const deleteTestsResult = await prisma.bloodTest.deleteMany({});
  console.log(`Deleted ${deleteTestsResult.count} blood tests`);

  // Verify the tables are empty
  const remainingOrders = await prisma.order.count();
  const remainingTests = await prisma.bloodTest.count();
  console.log('\nVerification:');
  console.log(`Remaining orders: ${remainingOrders}`);
  console.log(`Remaining blood tests: ${remainingTests}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
