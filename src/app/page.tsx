import { prisma } from '@/lib/prisma';
import { HomePage } from '@/components/HomePage';

type BloodTest = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  stripePriceId: string;
};

async function getBloodTests(): Promise<BloodTest[]> {
  try {
    console.log('Fetching blood tests from database...');
    const tests = await prisma.bloodTest.findMany({
      where: { 
        isActive: true,
        ...(process.env.NODE_ENV === 'production' ? {
          AND: [
            { stripePriceId: { not: '' } },
            { stripeProductId: { not: '' } },
            { name: { not: { contains: '£' } } },
            { name: { not: { contains: '–' } } }
          ]
        } : {})
      },
      orderBy: { name: 'asc' }
    });
    console.log('Found blood tests:', tests);
    const mappedTests = tests.map(test => ({
      id: test.id,
      name: test.name,
      slug: test.slug,
      price: test.price,
      description: test.description || '',
      stripePriceId: test.stripePriceId || ''
    }));
    console.log('Mapped blood tests:', mappedTests);
    return mappedTests;
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    return [];
  }
}

export default async function Home() {
  console.log('Fetching blood tests in Home component...');
  const tests = await getBloodTests();
  console.log('Blood tests fetched in Home component:', tests);
  return <HomePage tests={tests} />;
}
