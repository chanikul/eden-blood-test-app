import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const correctPrices = {
  'Eden Well Man': 149.99,
  'Eden Well Woman': 149.99,
  'TRT Review': 129.99,
  'Advanced Thyroid Panel': 169.99,
  'Weight Management Blood Test': 139.99,
  'Venous Testosterone Panel': 159.99,
  'Ultimate Sporting Performance Blood Test': 249.99
};

async function main() {
  try {
    // First, deactivate all blood tests
    await prisma.bloodTest.updateMany({
      data: {
        isActive: false
      }
    });
    console.log('Deactivated all blood tests');

    // For each test name, find all duplicates and keep only one with correct price
    for (const [testName, correctPrice] of Object.entries(correctPrices)) {
      const tests = await prisma.bloodTest.findMany({
        where: {
          name: testName
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (tests.length === 0) {
        console.log(`No test found for ${testName}`);
        continue;
      }

      // Keep the first one and update its price and status
      const testToKeep = tests[0];
      await prisma.bloodTest.update({
        where: {
          id: testToKeep.id
        },
        data: {
          price: correctPrice,
          isActive: true
        }
      });
      console.log(`Updated ${testName} with correct price £${correctPrice}`);

      // Deactivate any duplicates
      if (tests.length > 1) {
        const duplicateIds = tests.slice(1).map(t => t.id);
        await prisma.bloodTest.updateMany({
          where: {
            id: {
              in: duplicateIds
            }
          },
          data: {
            isActive: false,
            name: `${testName} (Archived)`
          }
        });
        console.log(`Deactivated ${duplicateIds.length} duplicates of ${testName}`);
      }
    }

    // Verify the final state
    const activeTests = await prisma.bloodTest.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('\nFinal active blood tests:');
    activeTests.forEach(test => {
      console.log(`- ${test.name} (£${test.price})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
