import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as any,
});

async function main() {
  console.log('Updating blood tests with Stripe IDs...');

  // Get all products from Stripe
  const products = await stripe.products.list();
  
  // Get all prices from Stripe
  const prices = await stripe.prices.list();

  // Update each blood test
  for (const product of products.data) {
    const price = prices.data.find(p => p.product === product.id);
    if (!price) continue;

    const bloodTest = await prisma.bloodTest.findFirst({
      where: { name: product.name }
    });

    if (!bloodTest) {
      console.log(`Blood test not found for product: ${product.name}`);
      continue;
    }

    await prisma.bloodTest.update({
      where: { id: bloodTest.id },
      data: {
        stripeProductId: product.id,
        stripePriceId: price.id,
      }
    });

    console.log(`Updated blood test: ${bloodTest.name}`);
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Price ID: ${price.id}`);
  }

  console.log('Done updating blood tests!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
