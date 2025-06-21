import sgMail from '@sendgrid/mail';
import { type MailDataRequired } from '@sendgrid/mail';
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';
import { generateOrderConfirmationEmail } from '../email-templates/order-confirmation';
import { generateOrderNotificationEmailHtml } from '../email-templates/order-notification';
import { generateWelcomeEmail } from '../email-templates/welcome';
import { renderAsync } from '@react-email/render';
import { DispatchNotificationEmail } from '../email-templates/dispatch-notification';

// Check if SendGrid API key is available
let sendGridInitialized = false;

try {
  if (process.env.SENDGRID_API_KEY) {
    console.log('Initializing SendGrid with API key:', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridInitialized = true;
    console.log('SendGrid initialized successfully');
  } else {
    console.warn('SENDGRID_API_KEY is not set - email functionality will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize SendGrid:', error);
}

type EmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(params: EmailParams): Promise<[sgMail.ClientResponse, {}] | null> {
  // If SendGrid is not initialized, log a warning and return null
  if (!sendGridInitialized) {
    console.warn('SendGrid not initialized - skipping email send');
    return null;
  }
  
  const { to, subject, text, html } = params;
  const isProduction = process.env.NODE_ENV === 'production';
  const forceRealEmails = process.env.FORCE_REAL_EMAILS === 'true';

  // Verify that we have HTML content for styled emails
  if (!html) {
    console.error('⚠️ WARNING: Email is missing HTML content! This will result in an unstyled email.');
  }

  // Log email details for debugging
  console.log('=== SENDING EMAIL ===');
  console.log('SendGrid Configuration:', {
    apiKeyPresent: !!process.env.SENDGRID_API_KEY,
    apiKeyLength: process.env.SENDGRID_API_KEY?.length,
    apiKeyPrefix: process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...` : 'NOT SET',
    supportEmail: process.env.SUPPORT_EMAIL || 'not set',
    environment: process.env.NODE_ENV,
    forceRealEmails
  });
  
  console.log('Email Details:', {
    to,
    from: `Eden Clinic for Men <${process.env.SUPPORT_EMAIL || 'admin@edenclinicformen.com'}>`,
    subject,
    textLength: text?.length,
    htmlLength: html?.length,
    hasHtml: !!html
  });

  // In development mode without forced real emails, just log and return
  if (!isProduction && !forceRealEmails) {
    console.log('Development mode: Email not sent. Would have sent:', { to, subject });
    // Return a mock successful response for development mode
    return [{ statusCode: 200, headers: { 'x-message-id': 'dev-mode-no-email-sent' }, body: {} }, {}];
  }

  // Prepare email data - ALWAYS include HTML content if available
  const emailData: MailDataRequired = {
    to,
    from: `Eden Clinic for Men <${process.env.SUPPORT_EMAIL || 'admin@edenclinicformen.com'}>`,
    subject,
    text, // Plain text fallback for email clients that don't support HTML
    html: html || undefined // Always prioritize HTML content
  };

  // Add retry logic for email sending
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Sending email to ${to} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Send the email via SendGrid
      const response = await sgMail.send(emailData);
      
      console.log('✅ Email sent successfully via SendGrid:', { 
        statusCode: response[0]?.statusCode,
        messageId: response[0]?.headers['x-message-id'],
        recipient: to,
        subject: subject
      });
      
      return response;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      console.error(`❌ Error sending email to ${to} (Attempt ${retryCount}/${MAX_RETRIES}):`, error);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      
      if (retryCount < MAX_RETRIES) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error(`Failed to send email to ${to} after ${MAX_RETRIES} attempts`);
  throw lastError;
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
    to: process.env.SUPPORT_EMAIL || 'admin@edenclinicformen.com',
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

  try {
    // Import the server-side implementation to avoid client/server boundary issues
    const { generateWelcomeEmailServer } = require('../email-templates/welcome-server.js');
    
    // Call the async function with the proper parameters
    const { subject, html } = await generateWelcomeEmailServer({
      name,
      email,
      password,
      orderId,
      testName
    });

    const response = await sendEmail({
      to: email,
      subject,
      text: `Welcome to Eden Clinic! Your account has been created. Email: ${email}, Password: ${password}`,
      html,
    });

    console.log('✅ EMAIL 3/3: Welcome email sent to:', email);
    return response;
  } catch (error) {
    console.error('❌ ERROR sending welcome email:', error);
    throw error;
  }
}

interface SendDispatchNotificationEmailParams {
  name: string;
  email: string;
  testName: string;
  orderId: string;
  dispatchDate: string;
}

export async function sendDispatchNotificationEmail({
  name,
  email,
  testName,
  orderId,
  dispatchDate
}: SendDispatchNotificationEmailParams) {
  console.log('Sending dispatch notification email to:', email);

  try {
    // Render the React Email template to HTML
    const html = await renderAsync(
      DispatchNotificationEmail({
        name,
        testName,
        orderId,
        dispatchDate
      })
    );

    const subject = 'Your Eden Clinic Blood Test Kit has been dispatched';
    
    const response = await sendEmail({
      to: email,
      subject,
      text: `Dear ${name},\n\nYour blood test kit has been dispatched and is on its way to you.\n\nTest Type: ${testName}\nOrder ID: ${orderId}\nDispatch Date: ${dispatchDate}\n\nBest regards,\nEden Clinic Team`,
      html,
    });

    console.log('✅ EMAIL: Dispatch notification sent to:', email);
    return response;
  } catch (error) {
    console.error('❌ ERROR sending dispatch notification email:', error);
    throw error;
  }
}
