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

    // Group products by name
    const productsByName = new Map<string, Stripe.Product[]>();
    products.data.forEach(p => {
      const existing = productsByName.get(p.name) || [];
      productsByName.set(p.name, [...existing, p]);
    });

    // For each group of products with the same name
    for (const [name, products] of productsByName) {
      if (products.length > 1) {
        console.log(`\nFound ${products.length} products named "${name}"`);
        
        // Sort by creation date, newest first
        products.sort((a, b) => b.created - a.created);
        
        // Keep the newest one with proper metadata
        const toKeep = products.find(p => p.metadata?.category === 'blood_test') || products[0];
        console.log(`Keeping: ${toKeep.id} (created ${new Date(toKeep.created * 1000).toISOString()})`);
        
        // Archive the others
        for (const p of products) {
          if (p.id !== toKeep.id) {
            console.log(`Archiving: ${p.id} (created ${new Date(p.created * 1000).toISOString()})`);
            await stripe.products.update(p.id, { active: false });
          }
        }
      }
    }

    console.log('\nCleanup complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
