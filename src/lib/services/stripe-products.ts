import Stripe from 'stripe';

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

// Initialize Stripe with fallback for development mode
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_key';
let stripe: Stripe;

try {
  // Cast the API version to any to avoid TypeScript errors with different Stripe versions
  stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16' as any,
  });
  console.log('Stripe client initialized successfully with API version 2023-10-16');
} catch (error) {
  console.error('Failed to initialize Stripe client:', error);
  // Create a mock Stripe client for development
  stripe = {
    products: {
      list: async () => ({ data: [] })
    },
    prices: {
      list: async () => ({ data: [] })
    }
  } as any;
}

// Mock data for development or fallback
const mockBloodTests: BloodTestProduct[] = [
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

// Helper function to process products and prices
function processProductsAndPrices(
  products: Stripe.Product[], 
  prices: Stripe.Price[], 
  productIds: string[]
): BloodTestProduct[] {
  const result: BloodTestProduct[] = [];

  // For each product ID, find the product and its prices
  for (const productId of productIds) {
    const product = products.find(p => p.id === productId);
    if (!product) continue;

    // Find prices for this product
    const productPrices = prices.filter(p => {
      // Check if the product is a string (ID) or an object
      const priceProductId = typeof p.product === 'string' ? p.product : (p.product as Stripe.Product).id;
      return priceProductId === productId;
    });

    // Sort prices by unit_amount (lowest first)
    productPrices.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));

    // Get the lowest price (or undefined if no prices)
    const lowestPrice = productPrices[0];

    // Add to result with the price information
    result.push({
      id: product.id,
      name: product.name,
      description: product.description || undefined, // Fix TypeScript error by converting null to undefined
      active: product.active,
      metadata: product.metadata || {},
      price: lowestPrice ? {
        id: lowestPrice.id,
        unit_amount: lowestPrice.unit_amount || 0,
        currency: lowestPrice.currency,
      } : null,
      hidden: product.metadata?.hidden === 'true',
    });
  }

  return result;
}

// Helper to fetch active blood test products and their prices from Stripe
export async function fetchBloodTestProducts(options: { fetchAll?: boolean } = {}): Promise<BloodTestProduct[]> {
  try {
    console.log('[Stripe] Fetching blood test products with options:', options);
    
    // Development mode bypass
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stripe] Development mode: Using mock blood test data');
      return mockBloodTests;
    }
    
    // Convention: products with metadata.type === 'blood_test' or name includes 'Blood Test'
    const products = await stripe.products.list({
      active: options.fetchAll ? undefined : true, // Include inactive products in admin mode
      limit: 100,
    });
    
    console.log(`[Stripe] Retrieved ${products.data.length} products from Stripe`);
    console.log('[DEBUG] All Stripe products:', JSON.stringify(products.data.map(p => ({
      id: p.id,
      name: p.name,
      active: p.active,
      metadata: p.metadata
    })), null, 2));

    // Filter products that have type: blood_test in metadata OR have 'Blood Test' in the name
    const productIds = products.data
      .filter((p) => 
        p.metadata?.type === 'blood_test' || 
        (p.name && p.name.toLowerCase().includes('blood test'))
      )
      .map((p) => p.id);

    console.log(`[Stripe] Filtered to ${productIds.length} blood test products:`, productIds);

    if (productIds.length === 0) {
      console.warn('[Stripe] No valid blood test products found.');
      return mockBloodTests; // Return mock data if no products found
    }
    
    // Fetch all prices for these products
    const pricesResponse = await stripe.prices.list({
      active: options.fetchAll ? undefined : true, // Include inactive prices in admin mode
      limit: 100,
      expand: ['data.product'],
    }).catch(err => {
      console.error('Stripe prices.list error:', {
        message: err.message,
        type: err.type,
        code: err.code,
        statusCode: err.statusCode
      });
      throw err;
    });
    
    console.log('[DEBUG] All Stripe prices:', JSON.stringify(pricesResponse.data.map(pr => ({
      id: pr.id,
      product: typeof pr.product === 'string' ? pr.product : (pr.product as Stripe.Product).id,
      active: pr.active,
      currency: pr.currency,
      unit_amount: pr.unit_amount
    })), null, 2));
    
    // Process and return the products with their prices
    return processProductsAndPrices(products.data, pricesResponse.data, productIds);
    
  } catch (error) {
    console.error('[Stripe] Error fetching products:', error);
    // Return mock data as fallback
    return mockBloodTests;
  }
}
