import sgMail from '@sendgrid/mail';

// Import the styled email templates
import { generateWelcomeEmail } from '../email-templates/welcome';
import { generateOrderConfirmationEmail } from '../email-templates/order-confirmation';
import { generateAdminNotificationEmail } from '../email-templates/admin-notification';
import { generatePasswordResetEmailHtml } from '../email-templates/password-reset';

// Initialize SendGrid
console.log('Initializing SendGrid API...');
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set');
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log('✅ SendGrid API initialized successfully');

// Define email params interface
interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

// Common email sender function
export async function sendEmail({ to, subject, text, html }: EmailParams) {
  // Determine email type for logging
  let emailType = 'UNKNOWN';
  if (subject.includes('Welcome')) emailType = '[EMAIL 3/3] WELCOME';
  else if (subject.includes('Order Confirmation')) emailType = '[EMAIL 1/3] ORDER CONFIRMATION';
  else if (subject.includes('New Order')) emailType = '[EMAIL 2/3] ADMIN NOTIFICATION';
  else emailType = '[EMAIL] OTHER';
  
  console.log(`📧 ${emailType} Sending email to: ${to}`);
  
  const msg = {
    to,
    from: process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'no-reply@edenclinic.co.uk',
    subject,
    text,
    html,
  };
  
  try {
    const response = await sgMail.send(msg);
    console.log(`✅ ${emailType} Email sent successfully!`);
    return response;
  } catch (error) {
    console.error(`❌ ${emailType} Error sending email:`, error);
    throw error;
  }
}

interface SendWelcomeEmailParams {
  email: string;
  name: string;
  password: string;
  orderId: string;
  testName: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  try {
    console.log('📧 [EMAIL 3/3] Generating welcome email with styled template...');
    
    // Generate welcome email using the styled template
    const { subject, html } = await generateWelcomeEmail({
      name: params.name,
      email: params.email,
      password: params.password,
      order: {
        id: params.orderId,
        patientName: params.name,
        patientEmail: params.email,
        bloodTest: {
          name: params.testName
        }
      }
    });
    
    console.log('📧 [EMAIL 3/3] Sending welcome email to:', params.email);
    
    // Send the welcome email
    await sendEmail({
      to: params.email,
      subject,
      text: `Welcome to Eden Clinic! Your account has been created. Email: ${params.email}, Password: ${params.password}`,
      html,
    });
    
    console.log('✅ [EMAIL 3/3] Welcome email sent successfully to:', params.email);
  } catch (error) {
    console.error('❌ [EMAIL 3/3] Error sending welcome email:', error);
    throw error;
  }
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
}

export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams) {
  try {
    console.log('📧 Generating password reset email...');
    
    // Generate reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${params.resetToken}`;
    
    // Generate HTML email content
    const html = generatePasswordResetEmailHtml(resetUrl);
    
    // Plain text version as fallback
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
    
    console.log('📧 Sending password reset email to:', params.to);
    
    await sendEmail({
      to: params.to,
      subject: 'Reset Your Password - Eden Clinic',
      text,
      html,
    });
    
    console.log('✅ Password reset email sent successfully to:', params.to);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}
