import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExactPrices() {
  const updates = [
    { name: 'Ultimate Sporting Performance Blood Test', price: 190.00 },
    { name: 'Venous Testosterone Panel', price: 55.00 },
    { name: 'Advanced Thyroid Panel', price: 50.00 },
    { name: 'Weight Management Blood Test', price: 50.00 },
    { name: 'Eden Well Woman', price: 115.00 },
    { name: 'TRT Review', price: 40.00 },
    { name: 'Eden Well Man', price: 120.00 },
    { name: 'Eden Well Man Plus', price: 140.00 }
  ];

  console.log('Updating prices to match Stripe dashboard...\n');

  for (const update of updates) {
    try {
      await prisma.bloodTest.updateMany({
        where: { name: update.name },
        data: { price: update.price }
      });
      console.log(`✅ Updated ${update.name} to £${update.price.toFixed(2)}`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.name}:`, error);
    }
  }

  // Verify final prices
  const bloodTests = await prisma.bloodTest.findMany({
    select: {
      name: true,
      price: true,
      stripePriceId: true
    }
  });

  console.log('\nFinal database prices:');
  console.table(bloodTests.map(test => ({
    name: test.name,
    price: `£${test.price.toFixed(2)}`,
    stripePriceId: test.stripePriceId
  })));
}

updateExactPrices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
