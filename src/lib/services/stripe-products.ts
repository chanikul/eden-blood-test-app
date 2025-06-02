import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
});

// Helper to fetch active blood test products and their prices from Stripe
export async function fetchBloodTestProducts(options: { fetchAll?: boolean } = {}) {
  // Convention: products with metadata.type === 'blood_test' or name includes 'Blood Test'
  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  const productIds = products.data
    .filter(
      (p) =>
        p.metadata?.type === 'blood_test' ||
        /blood test/i.test(p.name) ||
        /vitamin d|testosterone|thyroid|female hormone/i.test(p.name)
    )
    .map((p) => p.id);

  if (productIds.length === 0) {
    console.warn('[Stripe] No valid blood test products found.');
    return [];
  }

  // Fetch all prices for these products
  const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    expand: ['data.product'],
  });

  // Map productId to price
  const bloodTestProducts = products.data
    .filter((p) => productIds.includes(p.id))
    .map((product) => {
      const price = prices.data.find((pr) => pr.product === product.id && pr.active);
      const hidden = product.metadata?.hidden === 'true';
      if (!price) {
        console.warn(`[Stripe] Product missing price: ${product.name} (${product.id})`);
      }
      return price && product
        ? {
            id: product.id,
            name: product.name,
            slug: product.metadata?.slug || product.name.toLowerCase().replace(/\s+/g, '_'),
            description: product.description || '',
            price: price.unit_amount ? price.unit_amount / 100 : 0,
            priceId: price.id,
            currency: price.currency,
            active: product.active,
            created: product.created,
            hidden,
            metadata: product.metadata || {},
          }
        : null;
    })
    .filter(Boolean);

  // Log product count
  console.log(`[Stripe] Loaded ${bloodTestProducts.length} blood test products.`);

  // Filter out hidden products unless fetchAll is set (for admin)
  return options.fetchAll ? bloodTestProducts : bloodTestProducts.filter((p) => !p.hidden);
}

