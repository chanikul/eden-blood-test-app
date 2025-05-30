import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

async function main() {
  console.log('Starting Stripe test price update process...');
  
  try {
    // First, create a test product in Stripe
    console.log('Creating a test product in Stripe...');
    const product = await stripe.products.create({
      name: 'Test Blood Panel',
      description: 'A test blood panel for development',
    });
    console.log(`Created test product with ID: ${product.id}`);
    
    // Then, create a test price for this product
    console.log('Creating a test price...');
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 12000, // £120.00
      currency: 'gbp',
    });
    console.log(`Created test price with ID: ${price.id}`);
    
    // Update all blood tests to use this test price ID
    console.log('Updating all blood tests with the test price ID...');
    const updateResult = await prisma.bloodTest.updateMany({
      data: {
        stripePriceId: price.id,
        stripeProductId: product.id,
        isActive: true
      }
    });
    
    console.log(`Updated ${updateResult.count} blood tests with test price ID`);
    
    // Verify the updates
    const tests = await prisma.bloodTest.findMany();
    console.log(`\nVerified ${tests.length} blood tests now have the same test price ID:`);
    console.log(`Price ID: ${price.id}`);
    console.log(`Product ID: ${product.id}`);
    
  } catch (error: any) {
    console.error('Error updating test price IDs:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('Done!');
  });
