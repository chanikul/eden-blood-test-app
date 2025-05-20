import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

async function cleanupPrices() {
  // Get active price IDs from database
  const activePriceIds = (await prisma.bloodTest.findMany({
    select: { stripePriceId: true }
  })).map(test => test.stripePriceId);

  console.log('Active price IDs in database:', activePriceIds);

  // Get all active prices from Stripe
  const stripePrices = await stripe.prices.list({
    active: true,
    type: 'one_time'
  });

  // Deactivate prices not in database
  for (const price of stripePrices.data) {
    if (!activePriceIds.includes(price.id)) {
      console.log(`Deactivating old price: ${price.id}`);
      await stripe.prices.update(price.id, { active: false });
    }
  }

  console.log('Cleanup complete!');
}

cleanupPrices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
