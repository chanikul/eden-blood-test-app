require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not found in environment');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

async function activateProducts() {
  try {
    // Get all payment links
    const links = await stripe.paymentLinks.list({ limit: 100 });
    console.log('\nActivating products and prices...');
    
    for (const link of links.data) {
      // Get line items for each payment link
      const lineItems = await stripe.paymentLinks.listLineItems(link.id);
      
      for (const item of lineItems.data) {
        if (!item.price?.product) continue;
        
        const productId = typeof item.price.product === 'string' 
          ? item.price.product 
          : item.price.product.id;
          
        // Activate the product
        console.log(`\nActivating product ${productId}...`);
        await stripe.products.update(productId, { active: true });
        console.log('✓ Product activated');
        
        // Activate the price
        if (item.price.id) {
          console.log(`Activating price ${item.price.id}...`);
          await stripe.prices.update(item.price.id, { active: true });
          console.log('✓ Price activated');
        }
      }
      
      // Now activate the payment link
      console.log(`\nActivating payment link ${link.id}...`);
      await stripe.paymentLinks.update(link.id, { active: true });
      console.log(`✓ Payment link activated: ${link.url}`);
    }
    
    console.log('\nDone! All products, prices, and payment links are now active.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

activateProducts();
