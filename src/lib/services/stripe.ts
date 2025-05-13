import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface SyncResult {
  success: boolean;
  message: string;
  products: Array<{
    name: string;
    oldPrice?: number;
    newPrice: number;
    status: 'created' | 'updated' | 'archived';
  }>;
}

async function deactivateAllTests() {
  console.log('\n=== DEACTIVATING ALL BLOOD TESTS ===');
  
  // First, log all existing tests
  const allTests = await prisma.bloodTest.findMany({
    select: {
      id: true,
      name: true,
      stripeProductId: true,
      stripePriceId: true,
      isActive: true
    }
  });
  
  console.log('Existing tests:', allTests.map(t => ({
    name: t.name,
    active: t.isActive,
    stripeId: t.stripeProductId
  })));

  // Deactivate all tests
  const result = await prisma.bloodTest.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  console.log(`Deactivated ${result.count} blood tests`);

  // Verify deactivation
  const remaining = await prisma.bloodTest.count({ where: { isActive: true } });
  console.log(`Remaining active tests: ${remaining}`);
}

export async function syncStripeProducts(): Promise<SyncResult> {
  console.log('Starting Stripe products sync...');
  console.log(`Using Stripe ${process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST'} mode`);
  
  try {
    // Step 0: Deactivate all blood tests
    await deactivateAllTests();

    // Step 1: Fetch all active products from Stripe
    console.log('Fetching products from Stripe...');
    const allProducts = await stripe.products.list({ 
      active: true,
      expand: ['data.default_price']
    });
    console.log(`Found ${allProducts.data.length} total products in Stripe`);
    
    // Step 2: Filter for blood test products and get their prices
    console.log('\nProcessing products:');
    const validProducts = [];
    const productPrices = new Map<string, Stripe.Price>();

    for (const product of allProducts.data) {
      console.log(`\nProduct: ${product.name}`);
      console.log('ID:', product.id);
      console.log('Active:', product.active);
      console.log('Metadata:', JSON.stringify(product.metadata, null, 2));

      // Skip if not a blood test
      if (!product.metadata?.category || product.metadata.category !== 'blood_test') {
        console.log(`Skipping - not a blood test (category: ${product.metadata?.category || 'undefined'})`);
        continue;
      }

      // Skip if price in name
      if (product.name.includes('£') || product.name.includes('–')) {
        console.log('Skipping - price in name');
        continue;
      }

      // Get latest active price
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1
      });

      if (prices.data.length === 0) {
        console.log('Skipping - no active price');
        continue;
      }

      const price = prices.data[0];
      console.log(`Found price: £${price.unit_amount! / 100}`);
      
      validProducts.push(product);
      productPrices.set(product.id, price);
    }

    console.log(`\nFound ${validProducts.length} valid blood test products`);

    // Step 3: Create/update blood tests
    const changes: SyncResult['products'] = [];
    const activeProductIds = new Set<string>();

    for (const product of validProducts) {
      const price = productPrices.get(product.id)!;
      const priceAmount = price.unit_amount! / 100;
      activeProductIds.add(product.id);

      try {
        // First try to find an existing test
        const existingTest = await prisma.bloodTest.findFirst({
          where: { stripeProductId: product.id }
        });

        let test;
        if (existingTest) {
          // Update existing test
          test = await prisma.bloodTest.update({
            where: { id: existingTest.id },
            data: {
              name: product.name,
              description: product.description || '',
              price: priceAmount,
              stripePriceId: price.id,
              isActive: true
            }
          });
        } else {
          // Create new test
          const baseSlug = slugify(product.name, { lower: true });
          let finalSlug = baseSlug;
          let counter = 1;

          // Keep trying with numbered slugs until we find a unique one
          while (true) {
            try {
              test = await prisma.bloodTest.create({
                data: {
                  name: product.name,
                  slug: finalSlug,
                  description: product.description || '',
                  price: priceAmount,
                  stripeProductId: product.id,
                  stripePriceId: price.id,
                  isActive: true
                }
              });
              break;
            } catch (error: any) {
              if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
                continue;
              }
              throw error;
            }
          }
        }

        changes.push({
          name: product.name,
          oldPrice: test.price !== priceAmount ? test.price : undefined,
          newPrice: priceAmount,
          status: test.price !== priceAmount ? 'updated' : 'created'
        });
      } catch (error: any) {
        if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
          const uniqueSlug = slugify(`${product.name}-${Date.now()}`, { lower: true });
          const test = await prisma.bloodTest.create({
            data: {
              name: product.name,
              slug: uniqueSlug,
              description: product.description || '',
              price: priceAmount,
              stripeProductId: product.id,
              stripePriceId: price.id,
              isActive: true
            }
          });

          changes.push({
            name: product.name,
            newPrice: priceAmount,
            status: 'created'
          });
        } else {
          throw error;
        }
      }
    }

    // Step 4: Archive old tests
    const testsToArchive = await prisma.bloodTest.findMany({
      where: {
        isActive: true,
        NOT: { stripeProductId: { in: Array.from(activeProductIds) } }
      }
    });

    for (const test of testsToArchive) {
      await prisma.bloodTest.update({
        where: { id: test.id },
        data: {
          isActive: false,
          stripePriceId: null,
          stripeProductId: null
        }
      });

      changes.push({
        name: test.name,
        oldPrice: test.price,
        newPrice: 0,
        status: 'archived'
      });
    }

    // Step 5: Final check
    const finalActiveTests = await prisma.bloodTest.findMany({
      where: { 
        isActive: true,
        AND: [
          { stripePriceId: { not: null } },
          { stripeProductId: { not: null } }
        ]
      },
      orderBy: { name: 'asc' }
    });

    const summary = {
      total: validProducts.length,
      created: changes.filter(c => c.status === 'created').length,
      updated: changes.filter(c => c.status === 'updated').length,
      archived: changes.filter(c => c.status === 'archived').length,
      active: finalActiveTests.length
    };

    console.log('\nSync summary:', summary);
    console.log('Active tests:', finalActiveTests.map(t => t.name));

    return {
      success: true,
      message: `Synced ${summary.total} blood tests (${summary.created} created, ${summary.updated} updated, ${summary.archived} archived)`,
      products: changes
    };
  } catch (error: any) {
    console.error('Error syncing Stripe products:', error);
    return {
      success: false,
      message: `Error syncing Stripe products: ${error?.message || 'Unknown error'}`,
      products: []
    };
  }
}
