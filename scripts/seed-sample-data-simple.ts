import { PrismaClient, OrderStatus, TestStatus, ContactMethod, AddressType } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Simple password hash function using crypto
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding sample data...');
  
  // Create sample blood test if it doesn't exist
  const bloodTest = await prisma.bloodTest.upsert({
    where: { slug: 'sample-comprehensive-panel' },
    update: {},
    create: {
      name: 'Sample Comprehensive Panel',
      slug: 'sample-comprehensive-panel',
      description: 'A comprehensive blood test panel (SAMPLE DATA)',
      price: 129.99,
      isActive: true,
      stripeProductId: 'sample_prod_123',
      stripePriceId: 'sample_price_123',
    },
  });
  console.log('Created sample blood test:', bloodTest.name);

  // Create sample client users
  const sampleUser1 = await prisma.clientUser.upsert({
    where: { email: 'sample.user1@example.com' },
    update: {},
    create: {
      email: 'sample.user1@example.com',
      passwordHash: hashPassword('samplepass123'),
      name: 'John Sample',
      dateOfBirth: '1985-06-15',
      mobile: '+44 7700 900123',
      preferredContact: ContactMethod.EMAIL,
      active: true,
      lastLoginAt: new Date(),
      stripeCustomerId: 'sample_cus_123',
    },
  });
  console.log('Created sample user:', sampleUser1.name);

  const sampleUser2 = await prisma.clientUser.upsert({
    where: { email: 'sample.user2@example.com' },
    update: {},
    create: {
      email: 'sample.user2@example.com',
      passwordHash: hashPassword('samplepass123'),
      name: 'Sarah Sample',
      dateOfBirth: '1990-03-22',
      mobile: '+44 7700 900456',
      preferredContact: ContactMethod.MOBILE,
      active: true,
    },
  });
  console.log('Created sample user:', sampleUser2.name);

  // Create sample address for user 1
  const address = await prisma.address.upsert({
    where: { 
      id: 'sample-address-1'
    },
    update: {},
    create: {
      id: 'sample-address-1',
      type: AddressType.SHIPPING,
      name: 'Home Address',
      line1: '123 Sample Street',
      line2: 'Flat 4B',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom',
      isDefault: true,
      clientId: sampleUser1.id,
    },
  });
  console.log('Created sample address');

  // Create sample orders
  const sampleOrder1 = await prisma.order.upsert({
    where: { id: 'sample-order-1' },
    update: {},
    create: {
      id: 'sample-order-1',
      patientName: sampleUser1.name,
      patientEmail: sampleUser1.email,
      patientDateOfBirth: sampleUser1.dateOfBirth,
      patientMobile: sampleUser1.mobile,
      testName: bloodTest.name,
      status: OrderStatus.PAID,
      bloodTestId: bloodTest.id,
      clientId: sampleUser1.id,
      paymentId: 'sample_payment_123',
      stripeSessionId: 'sample_session_123',
      shippingAddress: {
        name: 'John Sample',
        line1: '123 Sample Street',
        line2: 'Flat 4B',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        isSample: true
      },
      notes: 'Sample order for testing',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });
  console.log('Created sample order 1');

  const sampleOrder2 = await prisma.order.upsert({
    where: { id: 'sample-order-2' },
    update: {},
    create: {
      id: 'sample-order-2',
      patientName: sampleUser2.name,
      patientEmail: sampleUser2.email,
      patientDateOfBirth: sampleUser2.dateOfBirth,
      patientMobile: sampleUser2.mobile,
      testName: bloodTest.name,
      status: OrderStatus.DISPATCHED,
      bloodTestId: bloodTest.id,
      clientId: sampleUser2.id,
      paymentId: 'sample_payment_456',
      stripeSessionId: 'sample_session_456',
      shippingAddress: {
        name: 'Sarah Sample',
        line1: '456 Sample Avenue',
        city: 'Manchester',
        postcode: 'M1 1AA',
        country: 'United Kingdom',
        isSample: true
      },
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
  });
  console.log('Created sample order 2');

  const sampleOrder3 = await prisma.order.upsert({
    where: { id: 'sample-order-3' },
    update: {},
    create: {
      id: 'sample-order-3',
      patientName: 'Alex Sample',
      patientEmail: 'alex.sample@example.com',
      patientDateOfBirth: '1978-11-30',
      patientMobile: '+44 7700 900789',
      testName: bloodTest.name,
      status: OrderStatus.PENDING,
      bloodTestId: bloodTest.id,
      paymentId: 'sample_payment_789',
      stripeSessionId: 'sample_session_789',
      shippingAddress: {
        name: 'Alex Sample',
        line1: '789 Sample Road',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        country: 'United Kingdom',
        isSample: true
      },
      createdAt: new Date(), // Today
    },
  });
  console.log('Created sample order 3');

  // Create sample test result
  const testResult = await prisma.testResult.upsert({
    where: { id: 'sample-test-result-1' },
    update: {},
    create: {
      id: 'sample-test-result-1',
      status: TestStatus.ready,
      resultUrl: 'https://example.com/sample-test-result.pdf',
      orderId: sampleOrder1.id,
      bloodTestId: bloodTest.id,
      clientId: sampleUser1.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });
  console.log('Created sample test result');

  console.log('Sample data seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding sample data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
