require('dotenv').config();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not found in environment');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

async function checkLinks() {
  try {
    const links = await stripe.paymentLinks.list({ limit: 100 });
    console.log('\nPayment Links:');
    links.data.forEach(link => {
      console.log(`\nLink ${link.id}:`);
      console.log(`- Active: ${link.active}`);
      console.log(`- URL: ${link.url}`);
      console.log(`- Live mode: ${link.livemode}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLinks();
