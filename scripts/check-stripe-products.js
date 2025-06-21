#!/usr/bin/env node
// scripts/check-stripe-products.js - Script to check Stripe products directly
require('dotenv').config();
const Stripe = require('stripe');

// Check if Stripe API key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is not set');
  console.log('Please make sure you have a .env file with STRIPE_SECRET_KEY defined');
  process.exit(1);
}

// Initialize Stripe with the API key
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Log the first few characters of the API key for verification
console.log(`Using Stripe API key: ${stripeSecretKey.substring(0, 8)}...`);

async function checkStripeProducts() {
  console.log('Fetching all products from Stripe...');
  
  try {
    // Get all products
    const productsResponse = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    console.log(`\n✅ Found ${productsResponse.data.length} total products`);
    
    // Filter for blood test products
    const bloodTestProducts = productsResponse.data.filter(
      (product) => product.metadata && product.metadata.type === 'blood_test'
    );
    
    console.log(`✅ Found ${bloodTestProducts.length} blood test products`);
    
    // Get all prices
    console.log('\nFetching prices for products...');
    const pricesResponse = await stripe.prices.list({
      limit: 100,
      active: true,
    });
    
    console.log(`✅ Found ${pricesResponse.data.length} total prices`);
    
    // Format products with their prices
    const formattedProducts = bloodTestProducts.map((product) => {
      const price = pricesResponse.data.find((p) => p.product === product.id);
      
      return {
        id: product.id,
        name: product.name,
        active: product.active,
        metadata: product.metadata || {},
        price: price
          ? {
              id: price.id,
              unit_amount: price.unit_amount,
              currency: price.currency,
            }
          : null,
      };
    });
    
    console.log('\n=== Blood Test Products ===');
    formattedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name} (${product.id})`);
      console.log(`   Active: ${product.active ? 'Yes' : 'No'}`);
      console.log(`   Type: ${product.metadata.type || 'Not set'}`);
      
      if (product.price) {
        console.log(
          `   Price: ${(product.price.unit_amount / 100).toFixed(2)} ${
            product.price.currency.toUpperCase()
          } (${product.price.id})`
        );
      } else {
        console.log('   Price: No price found');
      }
      
      // Log all metadata
      console.log('   Metadata:');
      Object.entries(product.metadata).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    });
    
    // Check for common issues
    console.log('\n=== Diagnostic Checks ===');
    
    // Check 1: No blood test products
    if (bloodTestProducts.length === 0) {
      console.error('❌ No blood test products found. Make sure products have metadata.type = "blood_test"');
    }
    
    // Check 2: Products without prices
    const productsWithoutPrices = formattedProducts.filter((p) => !p.price);
    if (productsWithoutPrices.length > 0) {
      console.error(`❌ ${productsWithoutPrices.length} blood test products don't have prices:`);
      productsWithoutPrices.forEach((p) => console.error(`   - ${p.name} (${p.id})`));
    }
    
    // Check 3: Inactive products
    const inactiveProducts = formattedProducts.filter((p) => !p.active);
    if (inactiveProducts.length > 0) {
      console.error(`❌ ${inactiveProducts.length} blood test products are inactive:`);
      inactiveProducts.forEach((p) => console.error(`   - ${p.name} (${p.id})`));
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total products: ${productsResponse.data.length}`);
    console.log(`Blood test products: ${bloodTestProducts.length}`);
    console.log(`Products with prices: ${formattedProducts.filter((p) => p.price).length}`);
    console.log(`Active blood test products with prices: ${formattedProducts.filter((p) => p.active && p.price).length}`);
    
    if (formattedProducts.length === 0) {
      console.error('\n❌ No blood test products found. The dropdown will be empty.');
      console.log('\nPossible solutions:');
      console.log('1. Create products in Stripe with metadata.type = "blood_test"');
      console.log('2. Check if your Stripe API key is correct');
      console.log('3. Verify that products are active and have prices');
    } else if (formattedProducts.filter((p) => p.active && p.price).length === 0) {
      console.error('\n❌ No active blood test products with prices found. The dropdown will be empty.');
      console.log('\nPossible solutions:');
      console.log('1. Activate your blood test products in Stripe');
      console.log('2. Add prices to your blood test products');
    } else {
      console.log('\n✅ Blood test products with prices found. The dropdown should work correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error fetching Stripe products:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('\nAuthentication error: Your Stripe API key may be invalid or expired.');
      console.log('Check your .env file and make sure STRIPE_SECRET_KEY is set correctly.');
    } else if (error.type === 'StripeConnectionError') {
      console.error('\nConnection error: Could not connect to Stripe API.');
      console.log('Check your internet connection or if Stripe is experiencing an outage.');
    }
  }
}

// Run the check
checkStripeProducts();
