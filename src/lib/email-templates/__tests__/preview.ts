import * as fs from 'fs/promises';
import * as path from 'path';
import { OrderStatus } from '@prisma/client';



async function generateEmailPreviews() {
  const outputDir = path.join(__dirname, 'previews');
  await fs.mkdir(outputDir, { recursive: true });

  // Welcome Email Preview
  const welcomeEmailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Eden Clinic</title>
</head>
<body style="margin: 0; padding: 32px; background-color: #f6f9fc; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">🩺</span>
      <h1 style="color: #1a1a1a; margin: 16px 0;">Welcome to Eden Clinic</h1>
    </div>
    
    <p style="color: #4a5568; line-height: 1.6;">Dear John Smith,</p>
    <p style="color: #4a5568; line-height: 1.6;">Thank you for choosing Eden Clinic. Your account has been successfully created.</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <h2 style="color: #2d3748; font-size: 20px;">Your Login Details</h2>
    <p style="color: #4a5568; line-height: 1.6;">
      Email: <strong>john.smith@example.com</strong><br>
      Password: <strong>TempPass123!</strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <div>
      <h2 style="color: #2d3748; font-size: 20px;">🩺 Your Test Order</h2>
      <div style="background-color: #f0f9ff; padding: 24px; border-radius: 8px; border: 1px solid #bae6fd;">
        <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
          <strong>Order ID:</strong> order_123<br>
          <strong>Test:</strong> Eden Well Man<br>
          <strong>Status:</strong> <span style="color: #059669;">Pending</span>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://eden-clinic.com/login" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 6px;">Login to Your Account</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <p style="color: #64748b; font-size: 14px; text-align: center;">
      Need help? Contact our support team at<br>
      <a href="mailto:support@eden-clinic.com" style="color: #0284c7; text-decoration: none;">support@eden-clinic.com</a>
    </p>
  </div>
</body>
</html>`;

  await fs.writeFile(
    path.join(outputDir, 'welcome.html'),
    welcomeEmailHtml
  );
  console.log('✅ Welcome email preview generated');

  // Order Confirmation Email Preview
  const orderConfirmationHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - Eden Clinic</title>
</head>
<body style="margin: 0; padding: 32px; background-color: #f6f9fc; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">✅</span>
      <h1 style="color: #1a1a1a; margin: 16px 0;">Order Confirmation</h1>
    </div>
    
    <p style="color: #4a5568; line-height: 1.6;">Dear John Smith,</p>
    <p style="color: #4a5568; line-height: 1.6;">Thank you for your order. Here are your order details:</p>
    
    <div style="background-color: #f0f9ff; padding: 24px; border-radius: 8px; border: 1px solid #bae6fd; margin: 24px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0;">Order Details</h2>
      <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
        <strong>Order ID:</strong> order_123<br>
        <strong>Test:</strong> Eden Well Man<br>
        <strong>Status:</strong> <span style="color: #059669;">Pending</span><br>
        <strong>Date:</strong> Thursday, 30 May 2025
      </p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0;">Shipping Address</h2>
      <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
        123 Test Street<br>
        Apt 4B<br>
        London<br>
        SW1A 1AA
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <h2 style="color: #2d3748; font-size: 20px;">Next Steps</h2>
    <ol style="color: #4a5568; line-height: 1.6;">
      <li>We'll prepare your test kit</li>
      <li>You'll receive a dispatch notification</li>
      <li>Follow the instructions in the kit</li>
      <li>Return your sample using the prepaid envelope</li>
    </ol>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://eden-clinic.com/orders/order_123" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 6px;">View Order Details</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    
    <p style="color: #64748b; font-size: 14px; text-align: center;">
      Questions about your order? Contact us at<br>
      <a href="mailto:support@eden-clinic.com" style="color: #0284c7; text-decoration: none;">support@eden-clinic.com</a>
    </p>
  </div>
</body>
</html>`;

  await fs.writeFile(
    path.join(outputDir, 'order-confirmation.html'),
    orderConfirmationHtml
  );
  console.log('✅ Order confirmation email preview generated');

  // Admin Notification Email Preview
  const adminNotificationHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Notification - Eden Clinic</title>
</head>
<body style="margin: 0; padding: 32px; background-color: #f6f9fc; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 48px;">🔔</span>
      <h1 style="color: #1a1a1a; margin: 16px 0;">New Blood Test Order</h1>
    </div>
    
    <div style="background-color: #f0f9ff; padding: 24px; border-radius: 8px; border: 1px solid #bae6fd; margin: 24px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0;">Order Information</h2>
      <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
        <strong>Order ID:</strong> order_123<br>
        <strong>Test:</strong> Eden Well Man<br>
        <strong>Date:</strong> Thursday, 30 May 2025, 00:14<br>
        <strong>Payment Status:</strong> <span style="color: #059669;">Paid</span>
      </p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0;">Customer Details</h2>
      <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
        <strong>Name:</strong> John Smith<br>
        <strong>Email:</strong> john.smith@example.com<br>
        <strong>Notes:</strong> No allergies
      </p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0;">Shipping Address</h2>
      <p style="color: #4a5568; line-height: 1.6; margin: 8px 0;">
        123 Test Street<br>
        Apt 4B<br>
        London<br>
        SW1A 1AA
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://eden-clinic.com/admin/orders/order_123" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 6px;">View in Dashboard</a>
    </div>
  </div>
</body>
</html>`;

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
  console.log('   - Order Details: ID, Test Name, Status, Date');
  console.log('   - Shipping Address: Full formatted address');
  console.log('   - Next steps guide');
  console.log('\n3. Admin Notification:');
  console.log('   - Order Details: ID, Test Name, Date');
  console.log('   - Customer Info: Name, Email, Notes');
  console.log('   - Payment Status with color coding');
  console.log('   - Shipping Address: Full formatted address');
  console.log('   - Quick link to admin dashboard');
}

generateEmailPreviews().catch(console.error);
