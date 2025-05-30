import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Load environment variables
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

type BloodTest = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
};

const bloodTests: BloodTest[] = [
  {
    name: 'Eden Well Man',
    slug: 'eden-well-man',
    description: 'Comprehensive health screening for men',
    price: 149.99,
    stripeProductId: 'prod_test_1',
    stripePriceId: 'price_test_1',
  },
  {
    name: 'Eden Well Man Plus',
    slug: 'eden-well-man-plus',
    description: 'Advanced health screening for men with additional markers',
    price: 199.99,
    stripeProductId: 'prod_test_2',
    stripePriceId: 'price_test_2',
  },
  {
    name: 'Eden Well Woman',
    slug: 'eden-well-woman',
    description: 'Comprehensive health screening for women',
    price: 149.99,
    stripeProductId: 'prod_test_3',
    stripePriceId: 'price_test_3',
  },
  {
    name: 'TRT Review',
    slug: 'trt-review',
    description: 'Testosterone Replacement Therapy monitoring',
    price: 129.99,
    stripeProductId: 'prod_test_4',
    stripePriceId: 'price_test_4',
  },
  {
    name: 'Advanced Thyroid Panel',
    slug: 'advanced-thyroid-panel',
    description: 'Detailed thyroid function analysis',
    price: 169.99,
    stripeProductId: 'prod_test_5',
    stripePriceId: 'price_test_5',
  },
  {
    name: 'Weight Management Blood Test',
    slug: 'weight-management',
    description: 'Key markers related to weight management and metabolism',
    price: 139.99,
    stripeProductId: 'prod_test_6',
    stripePriceId: 'price_test_6',
  },
  {
    name: 'Venous Testosterone Panel',
    slug: 'venous-testosterone',
    description: 'Comprehensive testosterone and related hormone analysis',
    price: 159.99,
    stripeProductId: 'prod_test_7',
    stripePriceId: 'price_test_7',
  },
  {
    name: 'Ultimate Sporting Performance Blood Test',
    slug: 'ultimate-sporting',
    description: 'Advanced panel for athletes and fitness enthusiasts',
    price: 249.99,
    stripeProductId: 'prod_test_8',
    stripePriceId: 'price_test_8',
  },
];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil' as any,
});

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil',
  });

  console.log('Creating Stripe products...');

  for (const test of bloodTests) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: test.name,
        description: test.description,
        metadata: {
          slug: test.slug,
          category: 'blood_test'
        },
      });
      console.log(`Created product: ${product.name}`);

      // Create price with unique lookup key
      const timestamp = Date.now();
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'gbp',
        unit_amount: Math.round(test.price * 100), // Convert to pence
        lookup_key: `${test.stripePriceId}_${timestamp}`, // Ensure uniqueness
      });
      console.log(`Created price for ${product.name}: £${test.price} (${price.id})`);

      // Store the created price ID in the database
      await prisma.bloodTest.update({
        where: { slug: test.slug },
        data: { stripePriceId: price.id, stripeProductId: product.id },
      });
    } catch (error) {
      console.error(`Error creating product ${test.name}:`, error);
    }
  }

  console.log('Done creating Stripe products!');
}

main().catch(console.error);
