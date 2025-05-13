import sgMail from '@sendgrid/mail';
import { type MailDataRequired } from '@sendgrid/mail';
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type EmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export const sendEmail = async ({ to, subject, text, html }: EmailParams): Promise<[sgMail.ClientResponse, {}]> => {
  try {
    console.log('Preparing to send email...');
    console.log('To:', to);
    console.log('Subject:', subject);
    
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
}

interface SendPaymentConfirmationEmailParams {
  fullName: string;
  email: string;
  dateOfBirth: string;
  testName: string;
  notes?: string;
  orderId: string;
}

export async function sendPaymentConfirmationEmail({
  fullName,
  email,
  testName,
  orderId,
}: SendPaymentConfirmationEmailParams) {
  try {
    const text = `
Dear ${fullName},

Thank you for your payment. Your blood test order has been confirmed.

Order Details:
Order ID: ${orderId}
Test: ${testName}

We'll be in touch shortly with next steps.

Best regards,
Eden Clinic Team
    `.trim();

    const html = `
<p>Dear ${fullName},</p>
<p>Thank you for your payment. Your blood test order has been confirmed.</p>
<h3>Order Details:</h3>
<ul>
  <li><strong>Order ID:</strong> ${orderId}</li>
  <li><strong>Test:</strong> ${testName}</li>
</ul>
<p>We'll be in touch shortly with next steps.</p>
<p>Best regards,<br>Eden Clinic Team</p>
    `.trim();

    await sendEmail({
      to: email,
      subject: 'Blood Test Order Payment Confirmed',
      text,
      html,
    });

    console.log("📨 Email sent successfully to:", email);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    // Don't throw the error as this is not critical
  }
}

export async function sendOrderNotificationEmail({
  fullName,
  email,
  dateOfBirth,
  testName,
  notes,
  orderId,
}: SendOrderNotificationEmailParams) {
  try {
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
      subject: 'New Blood Test Order',
      text: `
A new order has been received.

Order ID: ${orderId}
Name: ${fullName}
Email: ${email}
DOB: ${dateOfBirth}
Selected Test: ${testName}
${notes ? `Notes: ${notes}` : ''}

Shipping address will be visible in Stripe.
      `.trim(),
      html: `
<h2>New Blood Test Order</h2>
<ul>
  <li><strong>Order ID:</strong> ${orderId}</li>
  <li><strong>Name:</strong> ${fullName}</li>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>DOB:</strong> ${dateOfBirth}</li>
  <li><strong>Selected Test:</strong> ${testName}</li>
  ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
</ul>
<p>Shipping address will be visible in Stripe.</p>
      `.trim(),
    });
  } catch (error) {
    console.error('❌ SendGrid notification error:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    // Don't throw the error as this is not critical for the order process
  }
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
