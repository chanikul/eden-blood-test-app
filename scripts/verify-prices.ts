import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

async function verifyPrices() {
  console.log('Fetching prices from database and Stripe...\n');

  // Get all blood tests from database
  const bloodTests = await prisma.bloodTest.findMany({
    where: { isActive: true },
    select: {
      name: true,
      price: true,
      stripePriceId: true,
      stripeProductId: true
    }
  });

  console.log('Database prices:');
  console.table(bloodTests.map(test => ({
    name: test.name,
    price: `£${test.price.toFixed(2)}`,
    stripePriceId: test.stripePriceId
  })));

  // Get prices from Stripe
  const stripePrices = await stripe.prices.list({
    active: true,
    type: 'one_time',
    expand: ['data.product']
  });

  console.log('\nStripe prices:');
  console.table(stripePrices.data.map(price => ({
    name: (price.product as Stripe.Product).name,
    price: `£${(price.unit_amount! / 100).toFixed(2)}`,
    priceId: price.id
  })));

  // Check for mismatches
  console.log('\nChecking for price mismatches...');
  for (const test of bloodTests) {
    const stripePrice = stripePrices.data.find(p => p.id === test.stripePriceId);
    if (stripePrice) {
      const stripeAmount = stripePrice.unit_amount! / 100;
      if (test.price !== stripeAmount) {
        console.log(`\n❌ Price mismatch for ${test.name}:`);
        console.log(`   Database: £${test.price.toFixed(2)}`);
        console.log(`   Stripe:   £${stripeAmount.toFixed(2)}`);
      }
    } else {
      console.log(`\n❌ Price not found in Stripe: ${test.stripePriceId}`);
      console.log(`   Test: ${test.name}`);
    }
  }
}

verifyPrices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
