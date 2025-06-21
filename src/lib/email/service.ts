import sgMail from '@sendgrid/mail';
import { getWelcomeEmailTemplate, getPasswordResetEmailTemplate } from './templates';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface SendWelcomeEmailParams {
  email: string;
  name: string;
  password: string;
  orderId: string;
  testName: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  try {
    const msg = getWelcomeEmailTemplate(params);
    await sgMail.send(msg);
    console.log('Welcome email sent successfully to:', params.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
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
    const msg = getPasswordResetEmailTemplate(params);
    await sgMail.send(msg);
    console.log('Password reset email sent successfully to:', params.to);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
