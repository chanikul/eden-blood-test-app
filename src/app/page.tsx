import { prisma } from '@/lib/prisma';
import { HomePage } from '@/components/HomePage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BloodTest = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  stripePriceId: string;
  stripeProductId: string;
  isActive: boolean;
};

async function getBloodTests(): Promise<BloodTest[]> {
  try {
    console.log('Fetching blood tests from database...');
    await prisma.$connect();
    console.log('Database connection status:', await prisma.$queryRaw`SELECT 1`);
    
    // First, let's count all blood tests
    const totalCount = await prisma.bloodTest.count();
    console.log('Total blood tests in database:', totalCount);
    
    // Then count active blood tests
    const activeCount = await prisma.bloodTest.count({
      where: { isActive: true }
    });
    console.log('Active blood tests count:', activeCount);
    
    // Now get all blood tests
    const tests = await prisma.bloodTest.findMany({
      where: { 
        isActive: true
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        description: true,
        stripePriceId: true,
        stripeProductId: true,
        isActive: true
      }
    });
    
    console.log('Raw tests from database:', JSON.stringify(tests, null, 2));
    console.log('Found blood tests:', tests);
    const mappedTests = tests.map(test => ({
      id: test.id,
      name: test.name,
      slug: test.slug,
      price: test.price,
      description: test.description || '',
      stripePriceId: test.stripePriceId || '',
      stripeProductId: test.stripeProductId || '',
      isActive: test.isActive || false
    }));
    console.log('Mapped blood tests:', mappedTests);
    return mappedTests;
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    return [];
  }
}

export default async function Home() {
  try {
    console.log('Fetching blood tests in Home component...');
    const tests = await getBloodTests();
    console.log('Blood tests fetched in Home component:', tests);
    
    return <HomePage tests={tests} />;
  } catch (error) {
    console.error('Error in Home component:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Unable to Load Blood Tests</h1>
          <p className="text-gray-600 mb-8">We're experiencing technical difficulties. Please try again later or contact our support team.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
            <a
              href="mailto:support@edenclinic.co.uk"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-base font-medium rounded-md text-blue-600 hover:bg-blue-50"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
