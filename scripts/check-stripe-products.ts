import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not set');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    console.log('Fetching all products...');
    const products = await stripe.products.list({
      limit: 100,
      active: true
    });

    console.log(`\nFound ${products.data.length} products total`);
    
    const testProducts = products.data.filter(p => !p.livemode);
    console.log(`Found ${testProducts.length} test mode products`);
    
    console.log('\nTest mode products:');
    testProducts.forEach(p => {
      console.log('\n-------------------');
      console.log('Name:', p.name);
      console.log('ID:', p.id);
      console.log('Active:', p.active);
      console.log('Metadata:', JSON.stringify(p.metadata, null, 2));
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
