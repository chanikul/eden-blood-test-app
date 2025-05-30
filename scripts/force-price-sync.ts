import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

async function forcePriceSync() {
  console.log('Starting force price sync with Stripe...');

  // Get all active prices from Stripe
  const prices = await stripe.prices.list({
    active: true,
    type: 'one_time',
    expand: ['data.product']
  });

  console.log('\nStripe prices found:');
  for (const price of prices.data) {
    const product = price.product as Stripe.Product;
    console.log(`${product.name}: £${price.unit_amount! / 100} (${price.id})`);

    // Update database price
    try {
      const updated = await prisma.bloodTest.updateMany({
        where: {
          stripePriceId: price.id
        },
        data: {
          price: price.unit_amount! / 100,
          name: product.name
        }
      });

      if (updated.count > 0) {
        console.log(`✅ Updated in database: ${product.name}`);
      } else {
        console.log(`❌ No matching test found in database for price ID: ${price.id}`);
      }
    } catch (error) {
      console.error(`Error updating ${product.name}:`, error);
    }
  }

  // Verify final prices
  const bloodTests = await prisma.bloodTest.findMany({
    select: {
      name: true,
      price: true,
      stripePriceId: true
    }
  });

  console.log('\nFinal database prices:');
  console.table(bloodTests.map(test => ({
    name: test.name,
    price: `£${test.price.toFixed(2)}`,
    stripePriceId: test.stripePriceId
  })));
}

forcePriceSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
