import Stripe from 'stripe';
import slugify from 'slugify';



// Check if Stripe environment variables are available
let stripeInitialized = false;
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Use the updated API version
      apiVersion: '2023-10-16' as any
    });
    stripeInitialized = true;
    console.log('Stripe initialized successfully');
  } else {
    console.warn('STRIPE_SECRET_KEY is not set - Stripe functionality will be disabled');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET is not set - Stripe webhook verification will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

interface StripeMode {
  isTestMode: boolean;
  secretKey: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  details: {
    created: number;
    updated: number;
    archived: number;
  };
  products: Array<{
    name: string;
    oldPrice?: number;
    newPrice: number;
    status: 'created' | 'updated' | 'archived';
    stripeProductId: string;
    stripePriceId: string;
    paymentLinkUrl?: string;
  }>;
}

async function getStripeMode(): Promise<StripeMode | null> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const isTestMode = secretKey.startsWith('sk_test_');
  return { isTestMode, secretKey };
}

async function deactivateAllTests(): Promise<void> {
  console.log('Deactivating existing blood tests...');
  
  // Mark all existing blood tests as inactive
  const updateResult = await prisma.bloodTest.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });
  console.log(`Deactivated ${updateResult.count} existing blood tests`);
}

export async function syncStripeProducts(): Promise<SyncResult> {
  console.log('Starting complete Stripe sync...');
  
  try {
    // Check if Stripe is initialized
    if (!stripeInitialized || !stripe) {
      console.warn('Stripe is not initialized - sync operation aborted');
      return {
        success: false,
        message: 'Stripe is not configured',
        details: {
          created: 0,
          updated: 0,
          archived: 0
        },
        products: []
      };
    }
    
    // Step 1: Get Stripe mode
    const stripeMode = await getStripeMode();
    if (!stripeMode) {
      console.warn('Could not determine Stripe mode - sync operation aborted');
      return {
        success: false,
        message: 'Stripe configuration is incomplete',
        details: {
          created: 0,
          updated: 0,
          archived: 0
        },
        products: []
      };
    }
    
    const { isTestMode } = stripeMode;
    const mode = isTestMode ? 'test' : 'live';
    console.log(`Operating in ${mode} mode`);

    // Step 2: Deactivate existing tests
    await deactivateAllTests();

    // Step 3: Fetch all payment links from Stripe
    console.log('\nFetching payment links from Stripe...');
    const paymentLinks = await stripe.paymentLinks.list({
      limit: 100
    });

    console.log(`Total payment links found: ${paymentLinks.data.length}`);
    
    // Log all payment links for debugging
    paymentLinks.data.forEach(link => {
      console.log(`Link ${link.id}:`, {
        active: link.active,
        livemode: link.livemode,
        url: link.url
      });
    });

    // Filter for correct mode links (including inactive ones)
    const validLinks = paymentLinks.data.filter(link => 
      link.livemode === !isTestMode
    );
    console.log(`Found ${validLinks.length} ${mode} mode payment links (including inactive)`);

    const changes: SyncResult['products'] = [];

    // Step 4: Process each payment link
    for (const link of validLinks) {
      try {
        // Log payment link status
        console.log(`Processing link ${link.id} (${link.active ? 'active' : 'inactive'})...`);
        
        // Get the line items from the payment link
        console.log(`Fetching line items for link ${link.id}...`);
        const lineItems = await stripe.paymentLinks.listLineItems(link.id);
        
        if (lineItems.data.length === 0) {
          console.log(`Skipping link ${link.id} - no products`);
          continue;
        }

        // Get the first line item (payment links should only have one product)
        const item = lineItems.data[0];
        console.log(`Found line item:`, item);

        if (!item.price || !item.price.product) {
          console.log(`Skipping link ${link.id} - invalid price or product`);
          continue;
        }

        // Get the product details
        console.log(`Fetching product details for ${item.price.product}...`);
        const product = await stripe.products.retrieve(item.price.product as string);
        const price = item.price;
        const priceAmount = price.unit_amount! / 100;
        console.log(`Product details:`, {
          name: product.name,
          price: priceAmount,
          id: product.id
        });

        // Ensure required fields are present
        if (!product.name || !product.id || !price.id) {
          console.log(`Skipping product - missing required fields`);
          continue;
        }

        // Try to find existing blood test by product ID or slug
        const slug = slugify(product.name, { lower: true });
        const existingTest = await prisma.bloodTest.findFirst({
          where: {
            OR: [
              { stripeProductId: product.id },
              { slug: slug }
            ]
          }
        });

        let bloodTest;
        if (existingTest) {
          // Update existing test
          bloodTest = await prisma.bloodTest.update({
            where: { id: existingTest.id },
            data: {
              name: product.name,
              description: product.description || '',
              price: priceAmount,
              stripePriceId: price.id,
              isActive: link.active,
              slug: slug
            }
          });
        } else {
          // Create new test
          bloodTest = await prisma.bloodTest.create({
            data: {
              name: product.name,
              description: product.description || '',
              price: priceAmount,
              stripeProductId: product.id,
              stripePriceId: price.id,
              isActive: link.active,
              slug: slug
            }
          });
        }

        changes.push({
          name: bloodTest.name,
          newPrice: bloodTest.price,
          status: 'created',
          stripeProductId: bloodTest.stripeProductId || '',
          stripePriceId: bloodTest.stripePriceId || '',
          paymentLinkUrl: link.url
        });

        console.log(`Created: ${bloodTest.name} at £${bloodTest.price}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing link ${link.id}:`, errorMessage);
        // Skip this product but continue with others
        continue;
      }
    }

    const successMessage = `Successfully synced ${changes.length} blood tests`;
    console.log('\n' + successMessage);

    // Calculate sync details
    const details = changes.reduce(
      (acc, curr) => {
        acc[curr.status] += 1;
        return acc;
      },
      { created: 0, updated: 0, archived: 0 }
    );

    return {
      success: true,
      message: successMessage,
      details,
      products: changes
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', errorMessage);
    
    return {
      success: false,
      message: `Sync failed: ${errorMessage}`,
      details: { created: 0, updated: 0, archived: 0 },
      products: []
    };
  }
}
