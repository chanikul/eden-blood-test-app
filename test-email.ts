import { sendEmail } from './src/lib/services/email';

async function testEmail() {
  try {
    console.log('Testing email sending...');
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'chanikul@me.com',
      subject: 'Test Email',
      text: 'This is a test email to verify SendGrid configuration.',
    });
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

testEmail();
