import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bloodTests = [
  {
    name: 'Eden Well Man',
    slug: 'eden-well-man',
    description: 'Comprehensive health screening for men',
    price: 149.99,
  },
  {
    name: 'Eden Well Man Plus',
    slug: 'eden-well-man-plus',
    description: 'Advanced health screening for men with additional markers',
    price: 199.99,
  },
  {
    name: 'Eden Well Woman',
    slug: 'eden-well-woman',
    description: 'Comprehensive health screening for women',
    price: 149.99,
  },
  {
    name: 'TRT Review',
    slug: 'trt-review',
    description: 'Testosterone Replacement Therapy monitoring',
    price: 129.99,
  },
  {
    name: 'Advanced Thyroid Panel',
    slug: 'advanced-thyroid-panel',
    description: 'Detailed thyroid function analysis',
    price: 169.99,
  },
  {
    name: 'Weight Management Blood Test',
    slug: 'weight-management',
    description: 'Key markers related to weight management and metabolism',
    price: 139.99,
  },
  {
    name: 'Venous Testosterone Panel',
    slug: 'venous-testosterone',
    description: 'Comprehensive testosterone and related hormone analysis',
    price: 159.99,
  },
  {
    name: 'Ultimate Sporting Performance Blood Test',
    slug: 'ultimate-sporting',
    description: 'Advanced panel for athletes and fitness enthusiasts',
    price: 249.99,
  },
];

import { OrderStatus } from '@prisma/client';

const testOrders = [
  {
    patientName: 'John Smith',
    patientEmail: 'john.smith@example.com',
    patientDateOfBirth: '1985-06-15',
    patientMobile: '+44 7700 900123',
    testName: 'Eden Well Man',
    status: OrderStatus.PAID,
    createdAt: new Date('2025-05-09T14:30:00Z'),
    notes: 'Fasting blood test requested',
    shippingAddress: {
      street: '123 High Street',
      city: 'London',
      postcode: 'SW1A 1AA'
    }
  },
  {
    patientName: 'Sarah Johnson',
    patientEmail: 'sarah.j@example.com',
    patientDateOfBirth: '1990-03-22',
    patientMobile: '+44 7700 900456',
    testName: 'Advanced Thyroid Panel',
    status: OrderStatus.PENDING,
    createdAt: new Date('2025-05-10T09:15:00Z'),
    shippingAddress: {
      street: '45 Park Lane',
      city: 'Manchester',
      postcode: 'M1 1AA'
    }
  },
  {
    patientName: 'David Williams',
    patientEmail: 'david.w@example.com',
    patientDateOfBirth: '1978-11-30',
    patientMobile: '+44 7700 900789',
    testName: 'TRT Review',
    status: OrderStatus.DISPATCHED,
    createdAt: new Date('2025-05-08T11:00:00Z'),
    dispatchedAt: new Date('2025-05-09T15:30:00Z'),
    dispatchedBy: 'Admin User',
    shippingAddress: {
      street: '78 Queen Road',
      city: 'Birmingham',
      postcode: 'B1 1AA'
    }
  }
];

async function main() {
  console.log('Start seeding...');

  // Create blood tests
  for (const test of bloodTests) {
    await prisma.bloodTest.create({
      data: test,
    });
    console.log(`Created blood test: ${test.name}`);
  }

  // Create test orders
  for (const order of testOrders) {
    const createdOrder = await prisma.order.create({
      data: order,
    });
    console.log(`Created order for: ${createdOrder.patientName}`);
  }

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
