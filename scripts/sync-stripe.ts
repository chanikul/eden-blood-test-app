import { syncStripeProducts } from '../src/lib/services/stripe';

async function main() {
  try {
    const result = await syncStripeProducts();
    console.log('\nSync Results:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('\nProduct Changes:');
    result.products.forEach(product => {
      console.log(`\n${product.name}:`);
      if (product.oldPrice !== undefined) {
        console.log(`  Old Price: £${product.oldPrice}`);
      }
      console.log(`  New Price: £${product.newPrice}`);
      console.log(`  Status: ${product.status}`);
    });
  } catch (error) {
    console.error('Error syncing products:', error);
    process.exit(1);
  }
}

main();
