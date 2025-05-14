import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all blood tests
    const tests = await prisma.bloodTest.findMany();
    console.log(`Found ${tests.length} blood tests`);

    // Update the first set of blood tests to be active
    const testsToActivate = [
      'Eden Well Man',
      'Eden Well Woman',
      'TRT Review',
      'Advanced Thyroid Panel',
      'Weight Management Blood Test',
      'Venous Testosterone Panel',
      'Ultimate Sporting Performance Blood Test'
    ];

    for (const testName of testsToActivate) {
      const test = await prisma.bloodTest.updateMany({
        where: {
          name: testName
        },
        data: {
          isActive: true
        }
      });
      console.log(`Updated ${testName}:`, test);
    }

    // Verify active tests
    const activatedTests = await prisma.bloodTest.findMany({
      where: {
        isActive: true
      }
    });
    console.log('\nActive blood tests:');
    activatedTests.forEach(test => {
      console.log(`- ${test.name} (£${test.price})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
