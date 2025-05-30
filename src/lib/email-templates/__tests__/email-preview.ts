import * as fs from 'fs/promises';
import * as path from 'path';
import { OrderStatus } from '@prisma/client';
import { renderAsync } from '@react-email/render';
import WelcomeEmail from '../welcome-email.js';
import OrderConfirmationEmail from '../order-confirmation-email.js';
import AdminNotificationEmail from '../admin-notification-email.js';

const TEST_DATA = {
  welcome: {
    name: 'John Smith',
    email: 'john.smith@example.com',
    tempPassword: 'TempPass123!',
    order: {
      id: 'order_123',
      createdAt: new Date(),
      updatedAt: new Date(),
      patientName: 'John Smith',
      patientEmail: 'john.smith@example.com',
      patientDateOfBirth: '1990-01-01',
      patientMobile: '+44 7700 900123',
      testName: 'Eden Well Man',
      notes: 'No allergies',
      internalNotes: null,
      status: OrderStatus.PENDING,
      paymentStatus: 'paid',
      paymentId: 'pi_123',
      stripeSessionId: 'cs_test_123',
      stripePaymentIntentId: 'pi_123',
      shippingAddress: {
        line1: '123 Test Street',
        line2: 'Apt 4B',
        city: 'London',
        postcode: 'SW1A 1AA',
      },
      dispatchedAt: null,
      receivedAt: null,
      completedAt: null,
      dispatchedById: null,
      bloodTestId: 'test_123',
      clientId: 'client_123',
      createAccount: true,
    },
  },
  order: {
    name: 'John Smith',
    orderId: 'order_123',
    testName: 'Eden Well Man',
    shippingAddress: {
      line1: '123 Test Street',
      line2: 'Apt 4B',
      city: 'London',
      postcode: 'SW1A 1AA',
    },
    orderStatus: OrderStatus.PENDING,
    orderDate: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  },
  admin: {
    orderId: 'order_123',
    name: 'John Smith',
    email: 'john.smith@example.com',
    testName: 'Eden Well Man',
    shippingAddress: {
      line1: '123 Test Street',
      line2: 'Apt 4B',
      city: 'London',
      postcode: 'SW1A 1AA',
    },
    notes: 'No allergies',
    orderDate: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    paymentStatus: 'paid',
  },
};

async function generateEmailPreviews() {
  const outputDir = path.join(__dirname, 'previews');
  await fs.mkdir(outputDir, { recursive: true });

  // Generate Welcome Email Preview
  const welcomeHtml = await renderAsync(WelcomeEmail(TEST_DATA.welcome));
  await fs.writeFile(
    path.join(outputDir, 'welcome.html'),
    welcomeHtml
  );
  console.log('✅ Welcome email preview generated');

  // Generate Order Confirmation Email Preview
  const orderConfirmationHtml = await renderAsync(
    OrderConfirmationEmail({
      name: TEST_DATA.order.name,
      orderId: TEST_DATA.order.orderId,
      testName: TEST_DATA.order.testName,
      shippingAddress: TEST_DATA.order.shippingAddress,
      orderStatus: TEST_DATA.order.orderStatus,
      orderDate: TEST_DATA.order.orderDate,
    })
  );
  await fs.writeFile(
    path.join(outputDir, 'order-confirmation.html'),
    orderConfirmationHtml
  );
  console.log('✅ Order confirmation email preview generated');

  // Generate Admin Notification Email Preview
  const adminNotificationHtml = await renderAsync(
    AdminNotificationEmail(TEST_DATA.admin)
  );
  await fs.writeFile(
    path.join(outputDir, 'admin-notification.html'),
    adminNotificationHtml
  );
  console.log('✅ Admin notification email preview generated');

  console.log('\nEmail previews generated in:', outputDir);
  console.log('\nTemplate Details:');
  console.log('1. Welcome Email:');
  console.log('   - Includes: Name, Email, Temp Password');
  console.log('   - Order Context: ID, Test Name, Status');
  console.log('\n2. Order Confirmation:');
  console.log('   - Customer Details: Name, Email');
  console.log('   - Order Details: ID, Test Name');
  console.log('   - Shipping Address: Full formatted address');
  console.log('\n3. Admin Notification:');
  console.log('   - Order Details: ID, Test Name, Date');
  console.log('   - Customer Info: Name, Email');
  console.log('   - Payment Status with color coding');
  console.log('   - Shipping Address: Full formatted address');
}

generateEmailPreviews().catch(console.error);
