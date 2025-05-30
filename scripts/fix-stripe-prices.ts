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
  console.log('Starting Stripe price fix process...');
  
  try {
    // Step 1: Create new products and prices in Stripe for each blood test
    const bloodTests = await prisma.bloodTest.findMany();
    console.log(`Found ${bloodTests.length} blood tests to fix`);
    
    for (const test of bloodTests) {
      console.log(`\nProcessing blood test: ${test.name}`);
      
      // Create or retrieve product
      let product;
      try {
        if (test.stripeProductId) {
          console.log(`Trying to retrieve existing product: ${test.stripeProductId}`);
          try {
            product = await stripe.products.retrieve(test.stripeProductId);
            console.log('Found existing product');
          } catch (e) {
            console.log('Product not found, creating new one');
            product = await stripe.products.create({
              name: test.name,
              description: test.description,
              metadata: {
                bloodTestId: test.id
              }
            });
          }
        } else {
          console.log('No product ID, creating new product');
          product = await stripe.products.create({
            name: test.name,
            description: test.description,
            metadata: {
              bloodTestId: test.id
            }
          });
        }
        
        // Create a new price
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(test.price * 100), // Convert to cents/pence
          currency: 'gbp',
        });
        
        // Update the blood test with new Stripe IDs
        await prisma.bloodTest.update({
          where: { id: test.id },
          data: {
            stripeProductId: product.id,
            stripePriceId: price.id,
            isActive: true
          }
        });
        
        console.log(`Updated ${test.name} with:\n  - Product ID: ${product.id}\n  - Price ID: ${price.id}`);
      } catch (error: any) {
        console.error(`Error processing ${test.name}:`, error.message);
      }
    }
    
    // Step 2: Verify all tests have valid Stripe IDs
    const updatedTests = await prisma.bloodTest.findMany({
      where: {
        stripePriceId: { not: null },
        stripeProductId: { not: null }
      }
    });
    
    console.log(`\n${updatedTests.length} blood tests have valid Stripe IDs`);
    for (const test of updatedTests) {
      console.log(`- ${test.name}: ${test.stripePriceId}`);
    }
    
  } catch (error: any) {
    console.error('Error fixing Stripe prices:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('Done!');
  });
