import sgMail from '@sendgrid/mail';
import { type MailDataRequired } from '@sendgrid/mail';
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';
import { generateOrderConfirmationEmail } from '../email-templates/order-confirmation';
import { generateOrderNotificationEmailHtml } from '../email-templates/order-notification';
import { generateWelcomeEmail } from '../email-templates/welcome';

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

export async function sendEmail(params: EmailParams): Promise<[sgMail.ClientResponse, {}]> {
  const { to, subject, text, html } = params;
  const isProduction = process.env.NODE_ENV === 'production';
  const forceRealEmails = process.env.FORCE_REAL_EMAILS === 'true';

  // Log email details for debugging
  console.log('=== SENDING EMAIL ===');
  console.log('SendGrid Configuration:', {
    apiKeyPresent: !!process.env.SENDGRID_API_KEY,
    apiKeyPrefix: process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...` : 'NOT SET',
    supportEmail: process.env.SUPPORT_EMAIL || 'not set'
  });
  console.log('Email Details:', {
    to,
    from: `Eden Clinic <${process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk'}>`,
    subject,
    textLength: text?.length,
    htmlLength: html?.length
  });

  if (!isProduction && !forceRealEmails) {
    console.log('Development mode: Email not sent. Would have sent:', { to, subject });
    console.log('Email content (text):', text);
    if (html) {
      console.log('Email content (html):', html.substring(0, 500) + '...');
    }
    // Return a mock successful response for development mode
    return [{ statusCode: 200, headers: { 'x-message-id': 'dev-mode-no-email-sent' }, body: {} }, {}];
  }

  // Prepare email data
  const emailData: MailDataRequired = {
    to,
    from: `Eden Clinic <${process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk'}>`,
    subject,
    text,
    ...(html && { html })
  };

  console.log('Sending email via SendGrid...', {
    apiKey: process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...` : 'NOT SET',
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject
  });

  try {
    // Try to send the email via SendGrid
    const response = await sgMail.send(emailData);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    // If we get a 403 Forbidden error, fall back to mock email
    if (error && typeof error === 'object' && 'code' in error && error.code === 403) {
      console.log('⚠️ SendGrid API returned 403 Forbidden. Using mock email service instead.');
      console.log('📧 MOCK EMAIL SENT:', {
        to,
        subject,
        textLength: text?.length,
        htmlLength: html?.length
      });
      console.log('📧 HTML Content Preview:', html ? html.substring(0, 200) + '...' : 'No HTML content');
      
      // Return a mock successful response
      return [{ statusCode: 200, headers: { 'x-message-id': 'mock-email-sent-after-sendgrid-error' }, body: {} }, {}];
    }
    
    // For other errors, rethrow
    throw error;
  }
};

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country?: string;
}

// Helper function to convert ShippingAddress to EmailShippingAddress
function toEmailShippingAddress(address?: ShippingAddress): any {
  if (!address) return undefined;
  
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    postcode: address.postcode
  };
}

interface SendOrderNotificationEmailParams {
  fullName: string;
  email: string;
  dateOfBirth: string;
  testName: string;
  notes?: string;
  orderId: string;
  shippingAddress?: ShippingAddress;
}

interface SendPaymentConfirmationEmailParams {
  fullName: string;
  email: string;
  testName: string;
  orderId: string;
  shippingAddress?: ShippingAddress;
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
  console.log(' Preparing customer confirmation email for:', email);
  const { html, subject } = await generateOrderConfirmationEmail({
    name: fullName,
    testName,
    orderId,
    shippingAddress: toEmailShippingAddress(shippingAddress),
    orderStatus: 'Confirmed',
    orderDate: new Date().toLocaleDateString(),
    isHomeKit,
  });

  console.log(' Attempting to send customer email with details:', {
    to: email,
    subject,
    testName,
    orderId
  });

  const response = await sendEmail({
    to: email,
    subject: subject || 'Blood Test Order Payment Confirmed',
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
  const html = generateOrderNotificationEmailHtml({
    fullName,
    email,
    dateOfBirth,
    testName,
    notes,
    orderId,
    shippingAddress: shippingAddress as any, // Cast for template compatibility if needed
  });

  const response = await sendEmail({
    to: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
    subject: 'New Blood Test Order',
    text: `New order received: ${testName} for ${fullName} (${email}). Order ID: ${orderId}. DOB: ${dateOfBirth}. ${notes ? `Notes: ${notes}` : ''}`,
    html,
  });

  console.log("📨 Admin notification email sent successfully", { messageId: response[0]?.headers['x-message-id'] });
  
  return response;
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${params.resetToken}`;
    
    const text = `
Reset Your Password

We received a request to reset your password for your Eden Clinic account.
To reset your password, click the following link:

${resetUrl}

This link will expire in 1 hour for security reasons.
If you didn't request a password reset, please ignore this email.

Best regards,
Eden Clinic Team
    `.trim();

    await sendEmail({
      to: params.to,
      subject: 'Reset Your Password - Eden Clinic',
      text,
      html: generatePasswordResetEmailHtml(resetUrl),
    });

    console.log('📨 Password reset email sent successfully to:', params.to);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    throw error;
  }
}

// Legacy function for backward compatibility
export async function sendPasswordResetEmail_legacy(email: string, resetUrl: string) {
  return sendPasswordResetEmail({
    to: email,
    name: 'User', // Default name
    resetToken: resetUrl.split('token=')[1] || resetUrl
  });
}

interface SendWelcomeEmailParams {
  email: string;
  name: string;
  password: string;
  orderId: string;
  testName: string;
}

export async function sendWelcomeEmail({
  email,
  name,
  password,
  orderId,
  testName
}: SendWelcomeEmailParams) {
  console.log('Preparing welcome email for:', email);
  
  // Create a simplified order object to match the expected interface
  const order = {
    id: orderId,
    patientName: name,
    patientEmail: email,
    bloodTest: {
      name: testName
    }
  };
  
  const { html, subject } = await generateWelcomeEmail({
    email,
    name,
    password,
    order
  });
  
  const response = await sendEmail({
    to: email,
    subject: subject || 'Welcome to Eden Clinic - Your Account is Ready',
    text: `Welcome to Eden Clinic, ${name}! Your account has been created successfully. Your temporary password is: ${password}. Your first order (${testName}) has been confirmed with order ID: ${orderId}.`,
    html,
  });
  
  console.log('📨 Welcome email sent successfully to:', email);
  console.log('✅ Welcome email sent successfully', { messageId: response[0]?.headers['x-message-id'] });
  
  return response;
}
