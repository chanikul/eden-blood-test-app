// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
// Import stripe conditionally to avoid build errors
let stripe: any = null;

export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe not configured, skipping cleanup operation');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    // Only initialize Stripe if the key is available
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      const { stripe: stripeInstance } = await import('../../../../lib/stripe');
      stripe = stripeInstance;
    }

    const session = await getSession();
    
    // Only admins can perform cleanup operations
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Skip Stripe operations if not configured
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    // Step 1: Get all active Stripe products with type: blood_test
    const stripeProducts = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    const validProductIds = stripeProducts.data
      .filter((product: any) => product.metadata?.type === 'blood_test')
      .map((product: any) => product.id);
    
    console.log(`Found ${validProductIds.length} valid Stripe blood test products`);
    
    // Step 2: Delete test results that don't have a valid blood test
    const deletedTestResults = await prisma.testResult.deleteMany({
      where: {
        bloodTest: {
          stripeProductId: {
            notIn: validProductIds,
          },
        },
      },
    });
    
    console.log(`Deleted ${deletedTestResults.count} invalid test results`);
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      deletedTestResults: deletedTestResults.count
    });
    
  } catch (error) {
    console.error('Error in cleanup operation:', error);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
