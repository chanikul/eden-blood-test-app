// Script to list all active Stripe products
require('dotenv').config();
const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function listStripeProducts() {
  try {
    console.log('Fetching Stripe products...');
    
    // List all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });
    
    console.log(`Found ${products.data.length} active products`);
    
    // Display details for each product
    products.data.forEach((product) => {
      console.log('-----------------------------------');
      console.log(`Product ID: ${product.id}`);
      console.log(`Name: ${product.name}`);
      console.log(`Active: ${product.active}`);
      console.log(`Metadata.type: ${product.metadata.type || 'Not set'}`);
      console.log(`Description: ${product.description || 'No description'}`);
      
      // Check if this is a blood test product
      if (product.metadata.type === 'blood_test') {
        console.log('*** THIS IS A BLOOD TEST PRODUCT ***');
      }
    });
    
    // Count blood test products specifically
    const bloodTestProducts = products.data.filter(
      (product) => product.metadata.type === 'blood_test'
    );
    
    console.log('-----------------------------------');
    console.log(`Total blood test products: ${bloodTestProducts.length}`);
    
    if (bloodTestProducts.length === 0) {
      console.log('WARNING: No blood test products found!');
      console.log('Check if products exist in Stripe dashboard and have metadata.type = "blood_test"');
    }
    
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
  }
}

// Run the function
listStripeProducts();
