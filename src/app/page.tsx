import { PrismaClient } from '@prisma/client';
import { HomePage } from '@/components/HomePage';

const prisma = new PrismaClient();

async function getBloodTests() {
  // Always use mock data in development
  if (process.env.NODE_ENV === 'development') {
  // Mock blood test data
    return [
      {
        id: '1',
        name: 'Eden Well Man – £120',
        slug: 'eden-well-man',
        price: 120,
        description: 'Comprehensive health check for men',
      },
      {
        id: '2',
        name: 'Eden Well Man Plus – £140',
        slug: 'eden-well-man-plus',
        price: 140,
        description: 'Enhanced health check for men',
      },
      {
        id: '3',
        name: 'Eden Well Woman – £140',
        slug: 'eden-well-woman',
        price: 140,
        description: 'Comprehensive health check for women',
      },
      {
        id: '4',
        name: 'TRT Review – £90',
        slug: 'trt-review',
        price: 90,
        description: 'Testosterone replacement therapy review',
      },
      {
        id: '5',
        name: 'Advanced Thyroid Panel – £90',
        slug: 'advanced-thyroid-panel',
        price: 90,
        description: 'Comprehensive thyroid function assessment',
      },
      {
        id: '6',
        name: 'Weight Management Blood Test – £80',
        slug: 'weight-management-blood-test',
        price: 80,
        description: 'Blood tests for weight management',
      },
      {
        id: '7',
        name: 'Venous Testosterone Panel – £30',
        slug: 'venous-testosterone-panel',
        price: 30,
        description: 'Testosterone level assessment',
      },
      {
        id: '8',
        name: 'Ultimate Sporting Performance Blood Test – £180',
        slug: 'ultimate-sporting-performance-blood-test',
        price: 180,
        description: 'Comprehensive sports performance assessment',
      },
    ];
  }

  return await prisma.bloodTest.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function Home() {
  const tests = await getBloodTests();
  return <HomePage tests={tests} />;
}
