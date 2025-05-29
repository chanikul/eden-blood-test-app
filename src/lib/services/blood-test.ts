

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';

type StripeProduct = Stripe.Product;

export interface BloodTestOrderFormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  mobile?: string;
  testSlug: string;
  notes?: string;
}

export interface BloodTestOrderResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  checkoutUrl?: string;
}

export interface BloodTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  stripePriceId: string;
  stripeProductId: string;
  isActive: boolean;
}

async function fetchAllBloodTestProducts(): Promise<StripeProduct[]> {
  const products = await stripe.products.list({
    limit: 100,
    active: true
  });

  return products.data.filter((product: StripeProduct) => 
    product.metadata?.category === 'blood_test' && 
    product.metadata?.is_active === 'true' &&
    product.active
  );
}

async function getProductsWithPaymentLinks(): Promise<Set<string>> {
  const paymentLinks = await stripe.paymentLinks.list({
    limit: 100,
    active: true
  });

  const activeProductIds = new Set<string>();
  
  for (const link of paymentLinks.data) {
    try {
      const lineItems = await stripe.paymentLinks.listLineItems(link.id);
      for (const item of lineItems.data) {
        if (item.price?.product) {
          const productId = typeof item.price.product === 'string'
            ? item.price.product
            : item.price.product.id;
          activeProductIds.add(productId);
        }
      }
    } catch (error) {
      console.error(`Error fetching line items for payment link ${link.id}:`, error);
      // Continue with other payment links
      continue;
    }
  }

  return activeProductIds;
}

export async function getActiveBloodTests(options: { showAll?: boolean } = {}): Promise<BloodTest[]> {
  try {
    const { showAll = false } = options;
    console.log('Fetching blood tests from Stripe...');

    // Get all blood test products
    const allProducts = await fetchAllBloodTestProducts();
    console.log(`Found ${allProducts.length} blood test products with correct metadata`);

    let filteredProducts: StripeProduct[];
    if (showAll) {
      filteredProducts = allProducts;
    } else {
      // Get products with active payment links
      const productsWithLinks = await getProductsWithPaymentLinks();
      console.log(`Found ${productsWithLinks.size} products with payment links`);
      
      // Filter to only include products with payment links
      filteredProducts = allProducts.filter(product => 
        productsWithLinks.has(product.id)
      );
    }

    console.log(`Using ${filteredProducts.length} blood test products`);

    // Get blood tests from database that match filtered products
    const tests = await prisma.bloodTest.findMany({
      where: {
        stripeProductId: { in: filteredProducts.map(p => p.id) },
        isActive: true
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        stripePriceId: true,
        stripeProductId: true,
        isActive: true
      }
    });

    console.log(`Found ${tests.length} matching blood tests in database`);

    const result = tests.map(test => ({
      id: test.id,
      name: test.name,
      slug: test.slug,
      price: test.price,
      description: test.description || '',
      stripePriceId: test.stripePriceId || '',
      stripeProductId: test.stripeProductId || '',
      isActive: test.isActive
    }));

    // Log the results
    console.log(`Returning ${result.length} blood tests`);

    return result;
  } catch (error) {
    console.error('Error fetching active blood tests:', error);
    throw error;
  }
}

export async function submitBloodTestOrder(data: BloodTestOrderFormData): Promise<BloodTestOrderResponse> {
  try {
    console.log('Making API request to /api/order-blood-test');
    console.log('Request data:', data);

    const response = await fetch('/api/order-blood-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      console.error('API error:', result);
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Error in submitBloodTestOrder:', error);
    throw error;
  }
}
