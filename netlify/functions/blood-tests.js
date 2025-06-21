const Stripe = require('stripe');

// Handler for the Netlify function
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Log request details for debugging
  console.log('Blood tests function called');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Has Stripe key:', !!process.env.STRIPE_SECRET_KEY);
  console.log('Stripe key prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'missing');
  console.log('Request headers:', JSON.stringify(event.headers));
  console.log('Request path:', event.path);
  console.log('Request method:', event.httpMethod);
  
  try {
    // Initialize Stripe with the secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not defined');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Stripe API key is missing',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'unknown',
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY
        })
      };
    }
    
    // Log all environment variables (without values) for debugging
    console.log('Available environment variables:', Object.keys(process.env).join(', '));

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Fetch all active products
    console.log('Fetching products from Stripe...');
    const productsResponse = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });
    
    console.log(`Fetched ${productsResponse.data.length} products from Stripe`);
    
    // Filter products by metadata.type === 'blood_test'
    const bloodTestProducts = productsResponse.data.filter(product => 
      product.metadata && product.metadata.type === 'blood_test'
    );
    
    console.log(`Filtered to ${bloodTestProducts.length} blood test products`);
    
    // If no blood test products found, return mock data
    if (bloodTestProducts.length === 0) {
      console.log('No blood test products found, returning mock data');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
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
        ])
      };
    }
    
    // Fetch prices for the blood test products
    const priceIds = bloodTestProducts
      .map(product => product.default_price)
      .filter(Boolean);
    
    console.log(`Found ${priceIds.length} default prices`);
    
    const pricesResponse = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });
    
    // Process and format the products with their prices
    const formattedProducts = bloodTestProducts.map(product => {
      // Find the price for this product
      const price = pricesResponse.data.find(p => 
        typeof p.product === 'string' 
          ? p.product === product.id
          : p.product.id === product.id
      );
      
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        active: product.active,
        metadata: product.metadata || {},
        price: price ? {
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency
        } : null,
        hidden: product.metadata?.hidden === 'true'
      };
    });
    
    // Return the formatted products
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedProducts)
    };
    
  } catch (error) {
    console.error('Error fetching blood test products:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      type: error.type,
      code: error.code,
      stack: error.stack,
      stripeKey: process.env.STRIPE_SECRET_KEY ? 'exists (first 4 chars: ' + process.env.STRIPE_SECRET_KEY.substring(0, 4) + '...)' : 'missing'
    });
    
    // Try to get more information about the Stripe error
    let detailedError = {};
    if (error.type && error.type.startsWith('Stripe')) {
      detailedError = {
        type: error.type,
        code: error.code,
        param: error.param,
        decline_code: error.decline_code,
        stripeIdempotencyKey: error.idempotency_key
      };
    }
    
    // Return mock data as fallback
    console.log('Returning mock data as fallback due to error');
    return {
      statusCode: 200, // Return 200 with mock data instead of error
      headers,
      body: JSON.stringify([
        {
          id: 'mock_prod_1',
          name: 'Mock Blood Test Basic (Fallback)',
          description: 'A basic blood test panel (fallback due to Stripe API error)',
          active: true,
          metadata: { type: 'blood_test' },
          price: { id: 'mock_price_1', unit_amount: 9900, currency: 'gbp' },
          hidden: false
        },
        {
          id: 'mock_prod_2',
          name: 'Mock Blood Test Advanced (Fallback)',
          description: 'An advanced blood test panel (fallback due to Stripe API error)',
          active: true,
          metadata: { type: 'blood_test' },
          price: { id: 'mock_price_2', unit_amount: 14900, currency: 'gbp' },
          hidden: false
        }
      ])
    };
  }
};
