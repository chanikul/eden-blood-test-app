import { prisma } from '../src/lib/prisma';
import { syncStripeProducts } from '../src/lib/services/stripe';

async function main() {
  console.log('Starting sync and activate process...');

  // First sync with Stripe
  console.log('\nSyncing with Stripe...');
  const syncResult = await syncStripeProducts();
  console.log('Sync result:', syncResult);

  // Then activate all blood tests
  console.log('\nActivating blood tests...');
  const activateResult = await prisma.bloodTest.updateMany({
    where: {
      stripePriceId: { not: null },
      stripeProductId: { not: null }
    },
    data: { isActive: true }
  });
  console.log(`Activated ${activateResult.count} blood tests`);

  // Verify activation
  const activeTests = await prisma.bloodTest.findMany({
    where: { isActive: true },
    select: {
      name: true,
      price: true,
      stripePriceId: true,
      stripeProductId: true
    }
  });
  console.log('\nActive blood tests:', activeTests);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
