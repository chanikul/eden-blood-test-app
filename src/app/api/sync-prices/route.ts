import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

type SyncedBloodTest = {
  name: string;
  slug: string;
  price: number;
  stripePriceId: string;
  stripeProductId: string;
  isActive: boolean;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

export async function GET() {
  try {
    // Get all blood tests from database
    const bloodTests = await prisma.bloodTest.findMany();

    // Get all products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
      limit: 100
    });

    // Get all prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      type: 'one_time',
      limit: 100,
      expand: ['data.product']
    });

    // Sort prices by creation date (newest first) and group by product
    const pricesByProduct = new Map<string, Stripe.Price>();
    prices.data.forEach(price => {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      const existingPrice = pricesByProduct.get(productId);
      
      if (!existingPrice || price.created > existingPrice.created) {
        pricesByProduct.set(productId, price);
      }
    });

    const syncedTests: SyncedBloodTest[] = [];

    // Update each blood test with latest Stripe data
    for (const test of bloodTests) {
      const product = products.data.find(p => 
        p.metadata.category === 'blood_test' && 
        p.metadata.slug === test.slug
      );

      if (!product) {
        console.log(`No Stripe product found for blood test: ${test.name}`);
        continue;
      }

      const latestPrice = pricesByProduct.get(product.id);
      if (!latestPrice) {
        console.log(`No price found for product: ${product.name}`);
        continue;
      }

      // Update blood test with latest price and IDs
      const updatedTest = await prisma.bloodTest.update({
        where: { id: test.id },
        data: {
          name: product.name,
          price: latestPrice.unit_amount! / 100, // Convert from pence to pounds
          stripeProductId: product.id,
          stripePriceId: latestPrice.id,
          isActive: product.active
        }
      });

      if (updatedTest.name && updatedTest.slug && updatedTest.stripePriceId && updatedTest.stripeProductId) {
        syncedTests.push({
          name: updatedTest.name,
          slug: updatedTest.slug,
          price: updatedTest.price,
          stripePriceId: updatedTest.stripePriceId,
          stripeProductId: updatedTest.stripeProductId,
          isActive: updatedTest.isActive
        });
      }

      console.log(`Updated blood test: ${updatedTest.name} (£${updatedTest.price.toFixed(2)})`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Blood test prices synced with Stripe',
      syncedTests
    });

  } catch (error) {
    console.error('Error syncing prices:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync prices with Stripe' 
    }, { status: 500 });
  }
}
