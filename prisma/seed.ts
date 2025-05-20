import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const bloodTests = [
  {
    name: 'Eden Well Man',
    slug: 'eden-well-man',
    description: 'Comprehensive health screening for men',
    price: 149.99,
    stripeProductId: 'prod_test_1',
    stripePriceId: 'price_1RQDnaEaVUA3G0SJoRrtHcE8',
    isActive: true,
  },
  {
    name: 'Eden Well Man Plus',
    slug: 'eden-well-man-plus',
    description: 'Advanced health screening for men with additional markers',
    price: 199.99,
    stripeProductId: 'prod_test_2',
    stripePriceId: 'price_1RQDnaEaVUA3G0SJoRrtHcE8',
    isActive: true,
  },
  {
    name: 'Eden Well Woman',
    slug: 'eden-well-woman',
    description: 'Comprehensive health screening for women',
    price: 149.99,
    stripeProductId: 'prod_test_3',
    stripePriceId: 'price_1RQDncEaVUA3G0SJRyPBn668',
    isActive: true,
  },
  {
    name: 'TRT Review',
    slug: 'trt-review',
    description: 'Testosterone Replacement Therapy monitoring',
    price: 129.99,
    stripeProductId: 'prod_test_4',
    stripePriceId: 'price_1RQDncEaVUA3G0SJdNDyf1na',
    isActive: true,
  },
  {
    name: 'Advanced Thyroid Panel',
    slug: 'advanced-thyroid-panel',
    description: 'Detailed thyroid function analysis',
    price: 169.99,
    stripeProductId: 'prod_test_5',
    stripePriceId: 'price_1RQDndEaVUA3G0SJkwXZV2SE',
    isActive: true,
  },
  {
    name: 'Weight Management Blood Test',
    slug: 'weight-management',
    description: 'Key markers related to weight management and metabolism',
    price: 139.99,
    stripeProductId: 'prod_test_6',
    stripePriceId: 'price_1RQDneEaVUA3G0SJA83SChGJ',
    isActive: true,
  },
  {
    name: 'Venous Testosterone Panel',
    slug: 'venous-testosterone',
    description: 'Comprehensive testosterone and related hormone analysis',
    price: 159.99,
    stripeProductId: 'prod_test_7',
    stripePriceId: 'price_1RQDneEaVUA3G0SJngb9f25w',
    isActive: true,
  },
  {
    name: 'Ultimate Sporting Performance Blood Test',
    slug: 'ultimate-sporting',
    description: 'Advanced panel for athletes and fitness enthusiasts',
    price: 249.99,
    stripeProductId: 'prod_test_8',
    stripePriceId: 'price_1RQDnfEaVUA3G0SJdMreXvnw',
    isActive: true,
  },
];

import { OrderStatus } from '@prisma/client';

const testOrder = {
  id: 'test_order_123',
  patientName: 'John Smith',
  patientEmail: 'john.smith@example.com',
  patientDateOfBirth: '1985-06-15',
  patientMobile: '+44 7700 900123',
  testName: 'Eden Well Man',
  status: OrderStatus.PAID,
  notes: 'Fasting blood test requested',
  shippingAddress: JSON.stringify({
    line1: '123 High Street',
    city: 'London',
    postal_code: 'SW1A 1AA',
    country: 'GB'
  })
};

async function main() {
  console.log('Start seeding...');

  // First, create all blood tests
  console.log('Creating blood tests...');
  for (const test of bloodTests) {
    const bloodTest = await prisma.bloodTest.upsert({
      where: { slug: test.slug },
      update: test,
      create: test
    });
    console.log(`Upserted blood test: ${bloodTest.name}`);
  }

  // Create or update default admin user
  const defaultAdmin = await prisma.admin.upsert({
    where: { email: 'admin@edenclinic.co.uk' },
    update: {},
    create: {
      email: 'admin@edenclinic.co.uk',
      name: 'Admin User',
      passwordHash: await bcrypt.hash('test123', 10),
      role: AdminRole.SUPER_ADMIN,
    }
  });
  console.log(`Ensured default admin exists: ${defaultAdmin.email}`);

  // Create or update blood tests
  for (const test of bloodTests) {
    await prisma.bloodTest.upsert({
      where: { slug: test.slug },
      update: test,
      create: test,
    });
    console.log(`Ensured blood test exists: ${test.name}`);
  }

  // Create test order
  const bloodTest = await prisma.bloodTest.findFirst({
    where: { name: testOrder.testName }
  });

  if (!bloodTest) {
    console.error(`Blood test not found: ${testOrder.testName}`);
    return;
  }

  const { testName, id, ...orderData } = testOrder;

  const createdOrder = await prisma.order.upsert({
    where: { id },
    update: {
      ...orderData,
      testName,
      bloodTestId: bloodTest.id,
    },
    create: {
      ...orderData,
      id,
      testName,
      bloodTestId: bloodTest.id,
    },
  });
  console.log(`Ensured test order exists: ${createdOrder.patientName}`);


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
