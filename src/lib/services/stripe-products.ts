import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

// Helper to fetch active blood test products and their prices from Stripe
export async function fetchBloodTestProducts(options: { fetchAll?: boolean } = {}) {
  // Convention: products with metadata.type === 'blood_test' or name includes 'Blood Test'
  const products = await stripe.products.list({
    active: options.fetchAll ? undefined : true, // Include inactive products in admin mode
    limit: 100,
  });
  
  console.log('[DEBUG] All Stripe products:', JSON.stringify(products.data.map(p => ({
    id: p.id,
    name: p.name,
    active: p.active,
    metadata: p.metadata
  })), null, 2));

  // Only filter products that have type: blood_test in metadata
  const productIds = products.data
    .filter((p) => p.metadata?.type === 'blood_test')
    .map((p) => p.id);

  console.log('[DEBUG] Filtered product IDs with type=blood_test:', productIds);

  if (productIds.length === 0) {
    console.warn('[Stripe] No valid blood test products found.');
    return [];
  }

  // Fetch all prices for these products
  const prices = await stripe.prices.list({
    active: options.fetchAll ? undefined : true, // Include inactive prices in admin mode
    limit: 100,
    expand: ['data.product'],
  });
  
  console.log('[DEBUG] All Stripe prices:', JSON.stringify(prices.data.map(pr => ({
    id: pr.id,
    product: pr.product,
    active: pr.active,
    currency: pr.currency,
    unit_amount: pr.unit_amount
  })), null, 2));

  // Map productId to price
  // Include all products that match the blood test criteria, regardless of active status
  // Debug the prices data structure
  console.log('[DEBUG] Price objects with product IDs:', prices.data.map(p => ({
    id: p.id,
    product: typeof p.product === 'string' ? p.product : (p.product as any)?.id || 'unknown',
    active: p.active
  })));

  const bloodTestProducts = products.data
    .filter((p) => productIds.includes(p.id))
    .map((product) => {
      // Find price by comparing with product ID string or object
      let price = prices.data.find((pr) => {
        const prProduct = typeof pr.product === 'string' ? pr.product : (pr.product as any)?.id;
        return prProduct === product.id && pr.active;
      });

      // If no active price found, try to find any price
      if (!price) {
        price = prices.data.find((pr) => {
          const prProduct = typeof pr.product === 'string' ? pr.product : (pr.product as any)?.id;
          return prProduct === product.id;
        });
      }

      const hidden = product.metadata?.hidden === 'true';

      if (!price) {
        console.warn(`[Stripe] Product missing price: ${product.name} (${product.id})`);
        if (options.fetchAll) {
          return {
            id: product.id,
            name: product.name,
            slug: product.metadata?.slug || product.name.toLowerCase().replace(/\s+/g, '_'),
            description: product.description || '',
            price: 0,
            priceId: '',
            currency: 'gbp',
            active: product.active,
            created: product.created,
            hidden,
            metadata: product.metadata || {},
            missingPrice: true
          };
        }
        return null;
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

  // Filter out null values
  const validProducts = bloodTestProducts.filter(Boolean);
  
  // Filter out hidden products unless fetchAll is set (for admin)
  return options.fetchAll ? validProducts : validProducts.filter((p) => !p?.hidden);
}
