// SendGrid test email script
const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: process.env.SUPPORT_EMAIL || 'chanikul@me.com',
  from: process.env.SUPPORT_EMAIL || 'no-reply@edenclinic.co.uk',
  subject: 'Test Email from Eden Clinic',
  text: 'This is a test email to verify SendGrid configuration.',
  html: '<strong>This is a test email from SendGrid</strong>',
};

async function sendTestEmail() {
  try {
    console.log('Attempting to send test email...');
    console.log('Using API key:', process.env.SENDGRID_API_KEY?.substring(0, 10) + '...');
    console.log('From:', msg.from);
    console.log('To:', msg.to);
    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
  } catch (error) {
    console.error('Error sending email:');
    console.error(error.response ? error.response.body : error);
  }
}

sendTestEmail();
