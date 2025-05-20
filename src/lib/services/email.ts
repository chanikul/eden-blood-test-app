import sgMail from '@sendgrid/mail';
import { type MailDataRequired } from '@sendgrid/mail';
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';
import { generateOrderConfirmationEmailHtml } from '../email-templates/order-confirmation';
import { generateOrderNotificationEmailHtml } from '../email-templates/order-notification';

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
  try {
    console.log('=== SENDING EMAIL ===');
    console.log('SendGrid Configuration:', {
      apiKeyPresent: !!process.env.SENDGRID_API_KEY,
      apiKeyPrefix: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'not set',
      supportEmail: process.env.SUPPORT_EMAIL || 'not set'
    });
    console.log('Email Details:', {
      to,
      from: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
      subject,
      textLength: text?.length,
      htmlLength: html?.length
    });
    
    const msg: MailDataRequired = {
      to,
      from: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
      subject,
      text,
      html,
    };

    console.log('Sending email via SendGrid...', {
      apiKey: process.env.SENDGRID_API_KEY?.substring(0, 10) + '...',
      from: msg.from,
      to: msg.to,
      subject: msg.subject
    });
    const response = await sgMail.send(msg);
    console.log('Email sent successfully. Response:', response);
    
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
}

export async function sendPaymentConfirmationEmail({
  fullName,
  email,
  testName,
  orderId,
  shippingAddress,
}: SendPaymentConfirmationEmailParams) {
  console.log('🔄 Preparing customer confirmation email for:', email);
  const html = generateOrderConfirmationEmailHtml({
    fullName,
    testName,
    orderId,
    shippingAddress,
  });

  console.log('📧 Attempting to send customer email with details:', {
    to: email,
    subject: 'Blood Test Order Payment Confirmed',
    testName,
    orderId
  });

  const response = await sendEmail({
    to: email,
    subject: 'Blood Test Order Payment Confirmed',
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
    shippingAddress,
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

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
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

    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Eden Clinic Admin',
      text,
      html: generatePasswordResetEmailHtml(resetUrl),
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
