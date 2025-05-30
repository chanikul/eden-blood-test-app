import { syncStripeProducts } from '../src/lib/services/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  mode: 'test' | 'live';
  success: boolean;
  productsFound: number;
  productsInDb: number;
  error?: string;
}

async function testMode(secretKey: string): Promise<TestResult> {
  const mode = secretKey.startsWith('sk_test_') ? 'test' : 'live';
  console.log(`\n🔄 Testing ${mode} mode...`);
  
  try {
    // Set the environment variable
    process.env.STRIPE_SECRET_KEY = secretKey;

    // Run the sync
    console.log('Running Stripe sync...');
    const result = await syncStripeProducts();
    
    // Check database state
    const dbTests = await prisma.bloodTest.findMany();
    
    return {
      mode,
      success: true,
      productsFound: result.products.length,
      productsInDb: dbTests.length
    };
  } catch (error) {
    return {
      mode,
      success: false,
      productsFound: 0,
      productsInDb: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  console.log('🧪 Starting Stripe sync test...\n');

  // Verify environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }

  // Run sync in current mode
  const result = await testMode(process.env.STRIPE_SECRET_KEY);

  // Print results
  console.log('\n📊 Test Results:\n');
  console.log(`${result.mode.toUpperCase()} Mode:`, result.success ? '✅' : '❌');
  
  if (result.success) {
    console.log(`- Found ${result.productsFound} products`);
    console.log(`- Synced ${result.productsInDb} to database`);
  } else {
    console.log('- Error:', result.error);
  }
}

main().catch((error: Error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
