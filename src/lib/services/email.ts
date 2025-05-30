import sgMail from '@sendgrid/mail';
import { type MailDataRequired } from '@sendgrid/mail';

// Import correct email template generators
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';
import { generateOrderConfirmationEmail } from '../email-templates/order-confirmation';
import { generateAdminNotificationEmail } from '../email-templates/admin-notification';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

console.log('Initializing SendGrid with API key:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('SendGrid initialized successfully');

type EmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export const sendEmail = async ({ to, subject, text, html }: EmailParams): Promise<[sgMail.ClientResponse, {}]> => {
  // Extract email type from subject for logging
  let emailType = 'UNKNOWN';
  if (subject.includes('Welcome')) emailType = '[EMAIL 3/3] WELCOME';
  else if (subject.includes('Order Confirmation')) emailType = '[EMAIL 1/3] ORDER CONFIRMATION';
  else if (subject.includes('New Order')) emailType = '[EMAIL 2/3] ADMIN NOTIFICATION';
  else emailType = '[EMAIL] OTHER';
  
  try {
    console.log(`📧 ${emailType} === SENDING EMAIL ===`);
    
    // Verify SendGrid configuration
    if (!process.env.SENDGRID_API_KEY) {
      console.error(`❌ ${emailType} SENDGRID_API_KEY is not set or empty`);
      throw new Error('SENDGRID_API_KEY is not set or empty');
    }
    
    // Check for sender email
    const senderEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'no-reply@edenclinic.co.uk';
    console.log(`📧 ${emailType} SendGrid Configuration:`, {
      apiKeyPresent: !!process.env.SENDGRID_API_KEY,
      apiKeyPrefix: process.env.SENDGRID_API_KEY.substring(0, 5) + '...',
      senderEmail
    });
    
    console.log(`📧 ${emailType} Email Content Details:`, {
      to,
      from: senderEmail,
      subject,
      hasText: !!text,
      textLength: text?.length || 0,
      hasHtml: !!html,
      htmlLength: html?.length || 0,
      htmlPreview: html ? html.substring(0, 100) + '...' : 'No HTML content'
    });
    
    const msg: MailDataRequired = {
      to,
      from: senderEmail,
      subject,
      text,
      html,
    };

    console.log(`📧 ${emailType} Sending email via SendGrid...`);
    const response = await sgMail.send(msg);
    
    console.log(`✅ ${emailType} Email sent successfully!`, {
      to: msg.to,
      responseCode: response[0]?.statusCode,
      responseHeaders: response[0]?.headers,
      timestamp: new Date().toISOString()
    });
    
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};

interface SendOrderNotificationEmailParams {
  fullName: string;
  email: string;
  dateOfBirth: string;
  testName: string;
  notes?: string;
  orderId: string;
  shippingAddress?: string;
}

interface SendPaymentConfirmationEmailParams {
  fullName: string;
  email: string;
  testName: string;
  orderId: string;
  shippingAddress?: string;
  isHomeKit?: boolean;
}

export async function sendPaymentConfirmationEmail({
  fullName,
  email,
  testName,
  orderId,
  shippingAddress,
  isHomeKit,
}: SendPaymentConfirmationEmailParams) {
  console.log('🔄 Preparing customer confirmation email for:', email);
  
  // Generate the email HTML using the correct function
  console.log('📧 [EMAIL 1/3] Generating order confirmation email...');
  
  // Format shipping address if it's a string
  let formattedAddress;
  if (shippingAddress) {
    if (typeof shippingAddress === 'string') {
      try {
        // Try to parse as JSON if it's a string
        const parsedAddress = JSON.parse(shippingAddress);
        formattedAddress = {
          line1: parsedAddress.line1 || '',
          line2: parsedAddress.line2,
          city: parsedAddress.city || '',
          postcode: parsedAddress.postal_code || parsedAddress.postcode || '',
          country: parsedAddress.country || 'UK'
        };
      } catch (e) {
        // If can't parse, use the string directly
        console.log('Could not parse shipping address, using as string');
        formattedAddress = undefined;
      }
    } else {
      // If it's already an object, use it directly
      formattedAddress = shippingAddress;
    }
  }
  
  const { html, subject } = await generateOrderConfirmationEmail({
    name: fullName,
    testName,
    orderId,
    shippingAddress: formattedAddress,
    isHomeKit,
  });

  console.log('📧 [EMAIL 1/3] Sending customer order confirmation email:', {
    to: email,
    subject,
    testName,
    orderId
  });

  const response = await sendEmail({
    to: email,
    subject, // Use the subject from the template
    text: `Thank you for your order at Eden Clinic. Your blood test (${testName}) has been confirmed. Order ID: ${orderId}`,
    html,
  });

  console.log("📨 Customer email sent successfully to:", email);
  console.log("✅ Customer email sent successfully", { messageId: response[0]?.headers['x-message-id'] });
  
  return response;
}

export async function sendOrderNotificationEmail({
  fullName,
  email,
  dateOfBirth,
  testName,
  notes,
  orderId,
  shippingAddress,
}: SendOrderNotificationEmailParams) {
  console.log('📧 [EMAIL 2/3] Generating admin notification email...');
  
  // Format shipping address for admin notification
  let formattedAddress;
  if (shippingAddress) {
    if (typeof shippingAddress === 'string') {
      try {
        // Try to parse as JSON if it's a string
        const parsedAddress = JSON.parse(shippingAddress);
        formattedAddress = {
          line1: parsedAddress.line1 || '',
          line2: parsedAddress.line2,
          city: parsedAddress.city || '',
          postcode: parsedAddress.postal_code || parsedAddress.postcode || '',
          country: parsedAddress.country || 'UK'
        };
      } catch (e) {
        // If string can't be parsed as JSON, use it directly
        formattedAddress = shippingAddress; // Admin notification allows string addresses
      }
    } else {
      // If it's already an object, use it directly
      formattedAddress = shippingAddress;
    }
  }
  
  // Generate the admin notification email using the correct function
  const { html, subject } = await generateAdminNotificationEmail({
    name: fullName,
    email,
    dateOfBirth,
    testName,
    notes,
    orderId,
    shippingAddress: formattedAddress,
    paymentStatus: 'PAID'
  });

  console.log('📧 [EMAIL 2/3] Sending admin notification email to:', process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'no-reply@edenclinic.co.uk');
  
  const response = await sendEmail({
    to: process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'no-reply@edenclinic.co.uk',
    subject, // Use the subject from the template
    text: `New order received: ${testName} for ${fullName} (${email}). Order ID: ${orderId}. DOB: ${dateOfBirth}. ${notes ? `Notes: ${notes}` : ''}`,
    html,
  });

  console.log("📨 Admin notification email sent successfully", { messageId: response[0]?.headers['x-message-id'] });
  
  return response;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    console.log('📧 Generating password reset email...');
    
    // Generate plain text version
    const text = `
Reset Your Password

We received a request to reset your password for your Eden Clinic admin account.
To reset your password, click the following link:

${resetUrl}

This link will expire in 1 hour for security reasons.
If you didn't request a password reset, please ignore this email.

Best regards,
Eden Clinic Team
    `.trim();

    // Generate HTML version using the template
    const html = generatePasswordResetEmailHtml(resetUrl);
    
    console.log('Sending password reset email to:', email);
    
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Eden Clinic Admin',
      text,
      html,
    });

    console.log('📨 Password reset email sent successfully to:', email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    throw error;
  }
}
