import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

const prisma = new PrismaClient();

async function main() {
  // First, deactivate all blood tests
  await prisma.bloodTest.updateMany({
    data: {
      isActive: false
    }
  });
  console.log('Deactivated all existing blood tests');
  try {
    console.log('Fetching products from Stripe...');
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });

    console.log(`Found ${products.data.length} active products in Stripe`);

    for (const product of products.data) {
      const price = product.default_price as Stripe.Price;
      if (!price || price.type !== 'one_time') continue;

      const amount = price.unit_amount ? price.unit_amount / 100 : 0;
      console.log(`Processing ${product.name} - £${amount}`);

      // Find or create blood test
      // Try to find by Stripe product ID first, then by name
      let bloodTest = await prisma.bloodTest.findFirst({
        where: {
          stripeProductId: product.id
        }
      });

      if (!bloodTest) {
        bloodTest = await prisma.bloodTest.findFirst({
          where: {
            name: product.name
          }
        });
      }

      if (bloodTest) {
        // Update existing blood test
        await prisma.bloodTest.update({
          where: { id: bloodTest.id },
          data: {
            name: product.name,
            description: product.description || '',
            price: amount,
            isActive: product.active,
            stripePriceId: price.id,
            stripeProductId: product.id,
            slug: `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.id}`
          }
        });
        console.log(`Updated blood test: ${product.name}`);
      } else {
        // Create new blood test
        await prisma.bloodTest.create({
          data: {
            name: product.name,
            description: product.description || '',
            price: amount,
            isActive: product.active,
            stripePriceId: price.id,
            stripeProductId: product.id,
            slug: `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.id}`
          }
        });
        console.log(`Created new blood test: ${product.name}`);
      }
    }

    // Archive any blood tests not in this Stripe list
    const stripeProductNames = products.data.map(p => p.name);
    const testsToArchive = await prisma.bloodTest.findMany({
      where: {
        name: {
          notIn: stripeProductNames
        },
        NOT: {
          name: {
            endsWith: '(Archived)'
          }
        }
      }
    });

    for (const test of testsToArchive) {
      await prisma.bloodTest.update({
        where: { id: test.id },
        data: {
          isActive: false,
          name: `${test.name} (Archived)`
        }
      });
      console.log(`Archived blood test: ${test.name}`);
    }

    // Show final state
    const activeTests = await prisma.bloodTest.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    console.log('\nActive blood tests after sync:');
    activeTests.forEach(test => {
      console.log(`- ${test.name} (£${test.price})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
