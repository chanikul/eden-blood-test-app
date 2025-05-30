import Stripe from 'stripe';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkStripeProducts() {
  console.log('Checking Stripe products...');
  
  const allProducts = await stripe.products.list({
    limit: 100,
    active: true
  });

  console.log(`\nFound ${allProducts.data.length} active products:`);
  
  allProducts.data.forEach(p => {
    console.log(`\nProduct: ${p.name}`);
    console.log(`ID: ${p.id}`);
    console.log(`Active: ${p.active}`);
    console.log(`Livemode: ${p.livemode}`);
    console.log(`Metadata:`, p.metadata);
    
    // Check if product has the required metadata
    if (!p.metadata?.category) {
      console.log('WARNING: Missing category metadata');
    } else if (p.metadata.category !== 'blood_test') {
      console.log('WARNING: Category is not set to blood_test');
    }
  });
}

checkStripeProducts().catch(console.error);
