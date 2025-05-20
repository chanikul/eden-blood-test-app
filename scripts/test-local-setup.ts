import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('\n=== Environment Variables ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-10) : 'not set');
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? '***' + process.env.DIRECT_URL.slice(-10) : 'not set');
  console.log('NODE_ENV:', process.env.NODE_ENV);

  console.log('\n=== Testing Database Connection ===');
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');

    console.log('\n=== Fetching Blood Tests ===');
    const tests = await prisma.bloodTest.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${tests.length} active blood tests:`);
    tests.forEach(test => {
      console.log(`- ${test.name} (£${test.price})`);
      console.log(`  Stripe Product ID: ${test.stripeProductId || 'not set'}`);
      console.log(`  Stripe Price ID: ${test.stripePriceId || 'not set'}`);
      console.log('  ---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
