const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const app = express();
const port = 3001;

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// Enable CORS
app.use(cors());
app.use(express.json());

// Mock data for fallback
const mockProducts = [
  {
    id: 'mock_prod_1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood test that checks for a variety of conditions',
    price: 9900,
    stripePriceId: 'mock_price_1',
    isActive: true,
    slug: 'complete-blood-count',
  },
  {
    id: 'mock_prod_2',
    name: 'Liver Function Test',
    description: 'Checks how well your liver is working',
    price: 7900,
    stripePriceId: 'mock_price_2',
    isActive: true,
    slug: 'liver-function-test',
  },
];

// API endpoint for fetching blood test products
app.get('/api/blood-tests', async (req, res) => {
  try {
    // Use mock data for testing
    res.json(mockProducts);
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    res.status(500).json({ error: 'Failed to fetch blood tests' });
  }
});

// API endpoint for fetching Stripe products
app.get('/api/stripe-products-simple', async (req, res) => {
  try {
    // Fetch all products from Stripe with expanded price data
    const { data: products } = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Filter for blood test products and format the response
    const bloodTestProducts = products
      .filter(product => {
        // Check if product has metadata indicating it's a blood test
        return product.metadata.type === 'blood_test';
      })
      .map(product => {
        // Get the price object
        const price = product.default_price;
        
        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: price?.unit_amount || 0,
          stripePriceId: price?.id || '',
          isActive: product.active,
          slug: product.metadata.slug || product.id.toLowerCase(),
        };
      });

    // Return the formatted blood test products
    res.json(bloodTestProducts);
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    
    // Return mock data as fallback
    res.json(mockProducts);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Temporary server running at http://localhost:${port}`);
});
