import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Route segment config for Next.js 14 App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Mock data for development mode or when Stripe API fails
const mockBloodTests = [
  {
    id: 'mock_prod_1',
    name: 'Mock Blood Test Basic',
    description: 'A basic blood test panel',
    active: true,
    metadata: { type: 'blood_test' },
    price: { id: 'mock_price_1', unit_amount: 9900, currency: 'gbp' },
    hidden: false
  },
  {
    id: 'mock_prod_2',
    name: 'Mock Blood Test Advanced',
    description: 'An advanced blood test panel',
    active: true,
    metadata: { type: 'blood_test' },
    price: { id: 'mock_price_2', unit_amount: 14900, currency: 'gbp' },
    hidden: false
  }
];

// Define types for our products
type BloodTestProduct = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  metadata: Record<string, string>;
  price: {
    id: string;
    unit_amount: number;
    currency: string;
  } | null;
  hidden: boolean;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log('DEBUG Products API called:', req.url);
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers });
  }
  
  // Create a debug info object to track the process
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 4)}...` : 'missing',
    url: req.url,
    steps: [] as string[],
    errors: [] as string[],
    productCounts: {
      total: 0,
      bloodTests: 0,
      withPrices: 0,
      active: 0,
      formatted: 0
    }
  };
  
  // Add a step to the debug info
  const addStep = (message: string) => {
    console.log(`DEBUG STEP: ${message}`);
    debugInfo.steps.push(message);
  };
  
  // Add an error to the debug info
  const addError = (message: string, error?: any) => {
    console.error(`DEBUG ERROR: ${message}`, error);
    debugInfo.errors.push(message);
    if (error) {
      debugInfo.errors.push(`${error.name}: ${error.message}`);
    }
  };
  
  try {
    addStep('Starting product fetch process');
    
    // Check if Stripe API key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      addError('STRIPE_SECRET_KEY is not defined');
      throw new Error('Stripe API key is missing');
    }
    
    addStep('Initializing Stripe client');
    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    });
    
    // Fetch all products (including inactive for debugging)
    addStep('Fetching all products from Stripe');
    const productsResponse = await stripe.products.list({
      limit: 100,
    });
    
    debugInfo.productCounts.total = productsResponse.data.length;
    addStep(`Fetched ${productsResponse.data.length} total products from Stripe`);
    
    // Log all products for debugging
    addStep('Listing all products:');
    productsResponse.data.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name} (${product.id}), active: ${product.active}, metadata:`, product.metadata);
    });
    
    // Count active products
    const activeProducts = productsResponse.data.filter(p => p.active);
    debugInfo.productCounts.active = activeProducts.length;
    addStep(`Found ${activeProducts.length} active products`);
    
    // Filter products by metadata.type === 'blood_test'
    const bloodTestProducts = productsResponse.data.filter(product => 
      product.metadata && product.metadata.type === 'blood_test'
    );
    
    debugInfo.productCounts.bloodTests = bloodTestProducts.length;
    addStep(`Filtered to ${bloodTestProducts.length} blood test products`);
    
    // Log blood test products for debugging
    addStep('Listing blood test products:');
    bloodTestProducts.forEach((product, index) => {
      console.log(`Blood Test ${index + 1}: ${product.name} (${product.id}), active: ${product.active}, metadata:`, product.metadata);
    });
    
    // If no blood test products found, return mock data
    if (bloodTestProducts.length === 0) {
      addStep('No blood test products found, returning mock data');
      return NextResponse.json({
        products: mockBloodTests,
        debug: debugInfo
      }, { 
        headers: {
          ...headers,
          'X-Fallback': 'Using mock data (no blood test products found)'
        }
      });
    }
    
    // Fetch prices for all products
    addStep('Fetching prices from Stripe');
    const pricesResponse = await stripe.prices.list({
      limit: 100,
      expand: ['data.product'],
    });
    
    addStep(`Fetched ${pricesResponse.data.length} prices from Stripe`);
    
    // Log all prices for debugging
    addStep('Listing all prices:');
    pricesResponse.data.forEach((price, index) => {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      console.log(`Price ${index + 1}: ${price.id}, product: ${productId}, amount: ${price.unit_amount}, currency: ${price.currency}, active: ${price.active}`);
    });
    
    // Process and format the products with their prices
    addStep('Formatting products with prices');
    const formattedProducts: BloodTestProduct[] = bloodTestProducts.map(product => {
      // Find the price for this product
      const price = pricesResponse.data.find(p => 
        typeof p.product === 'string' 
          ? p.product === product.id
          : p.product.id === product.id
      );
      
      if (price) {
        debugInfo.productCounts.withPrices++;
      }
      
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        active: product.active,
        metadata: product.metadata || {},
        price: price ? {
          id: price.id,
          unit_amount: price.unit_amount || 0,
          currency: price.currency
        } : null,
        hidden: product.metadata?.hidden === 'true'
      };
    });
    
    debugInfo.productCounts.formatted = formattedProducts.length;
    
    // Log detailed product information for debugging
    addStep('Final formatted products:');
    formattedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.id}) - Price: ${product.price?.unit_amount ?? 'N/A'}, Hidden: ${product.hidden}`);
    });
    
    // Return the formatted products with debug info
    return NextResponse.json({
      products: formattedProducts,
      debug: debugInfo
    }, { headers });
    
  } catch (error: any) {
    addError('Failed to fetch Stripe products', error);
    
    // Return mock data with debug info
    return NextResponse.json({
      products: mockBloodTests,
      debug: debugInfo
    }, {
      headers: {
        ...headers,
        'X-Error': error.message || 'Unknown error',
        'X-Fallback': 'Using mock data due to error'
      }
    });
  }
}
