import { PrismaClient, AdminRole, OrderStatus, TestStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed test data...');

  try {
    // 1. Create admin user with edenclinicformen.com domain
    const adminEmail = 'admin@edenclinicformen.com';
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const passwordHash = await hash('TestPassword123!', 10);
      
      await prisma.admin.create({
        data: {
          email: adminEmail,
          name: 'Test Admin',
          passwordHash,
          role: AdminRole.SUPER_ADMIN,
          active: true,
          lastLoginAt: new Date()
        }
      });
      console.log(`✅ Created admin user: ${adminEmail}`);
    } else {
      console.log(`ℹ️ Admin user ${adminEmail} already exists, skipping creation`);
    }

    // 2. Create client user with edenclinicformen.com domain
    const clientEmail = 'client@edenclinicformen.com';
    const existingClient = await prisma.clientUser.findUnique({
      where: { email: clientEmail }
    });

    let clientId: string;
    
    if (!existingClient) {
      const passwordHash = await hash('TestPassword123!', 10);
      const newClient = await prisma.clientUser.create({
        data: {
          email: clientEmail,
          passwordHash,
          name: 'Test Client',
          dateOfBirth: '1990-01-01',
          mobile: '+44123456789',
          addresses: {
            create: {
              type: 'SHIPPING',
              name: 'Home',
              line1: '123 Test Street',
              city: 'London',
              postcode: 'W1 1AA',
              country: 'United Kingdom',
              isDefault: true
            }
          },
          stripeCustomerId: `cus_test_${uuidv4().substring(0, 8)}`,
          active: true
        }
      });
      clientId = newClient.id;
      console.log(`✅ Created client user: ${clientEmail}`);
    } else {
      clientId = existingClient.id;
      console.log(`ℹ️ Client user ${clientEmail} already exists, skipping creation`);
    }

    // 3. Create a blood test product if it doesn't exist
    const testSlug = 'testosterone-test';
    const existingTest = await prisma.bloodTest.findUnique({
      where: { slug: testSlug }
    });

    let bloodTestId: string;
    
    if (!existingTest) {
      const newTest = await prisma.bloodTest.create({
        data: {
          name: 'Testosterone Test',
          slug: testSlug,
          description: 'Comprehensive testosterone level test',
          price: 7900, // £79.00
          isActive: true,
          stripeProductId: `prod_test_${uuidv4().substring(0, 8)}`,
          stripePriceId: `price_test_${uuidv4().substring(0, 8)}`,
          // Removed metadata field for compatibility
        }
      });
      bloodTestId = newTest.id;
      console.log(`✅ Created blood test: Testosterone Test`);
    } else {
      bloodTestId = existingTest.id;
      console.log(`ℹ️ Blood test 'Testosterone Test' already exists, skipping creation`);
    }

    // 4. Create test order
    const orderId = uuidv4();
    const existingOrder = await prisma.order.findFirst({
      where: {
        clientId,
        bloodTestId
      }
    });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          id: orderId,
          clientId,
          bloodTestId,
          status: OrderStatus.PAID,
          paymentId: `pi_test_${uuidv4().substring(0, 8)}`,
          stripeSessionId: `cs_test_${uuidv4().substring(0, 8)}`,
          patientDateOfBirth: '1990-01-01',

          patientName: 'Test Client',
          patientEmail: clientEmail,
          shippingAddress: {
            create: {
              line1: '123 Test Street',
              city: 'London',
              postcode: 'W1 1AA',
              country: 'United Kingdom'
            }
          },
          testName: 'Testosterone Test',
          // Removed metadata field for compatibility
        }
      });
      console.log(`✅ Created test order: ${orderId}`);

      // 5. Create test result (processing status)
      const resultId = uuidv4();
      await prisma.testResult.create({
        data: {
          id: resultId,
          orderId,
          clientId,
          bloodTestId,
          status: TestStatus.processing,
          // Removed metadata field for compatibility
        }
      });
      console.log(`✅ Created test result: ${resultId} (processing status)`);
    } else {
      console.log(`ℹ️ Order for client ${clientId} and test ${bloodTestId} already exists, skipping creation`);
    }

    console.log('✅ Seed completed successfully!');
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@edenclinicformen.com / TestPassword123!');
    console.log('Client: client@edenclinicformen.com / TestPassword123!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
