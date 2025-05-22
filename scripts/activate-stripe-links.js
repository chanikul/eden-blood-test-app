require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not found in environment');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

async function activateLinks() {
  try {
    const links = await stripe.paymentLinks.list({ limit: 100 });
    console.log('\nActivating payment links...');
    
    for (const link of links.data) {
      if (!link.active) {
        console.log(`\nActivating link ${link.id}...`);
        await stripe.paymentLinks.update(link.id, { active: true });
        console.log(`✓ Activated ${link.url}`);
      }
    }
    
    console.log('\nDone! All payment links are now active.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

activateLinks();
