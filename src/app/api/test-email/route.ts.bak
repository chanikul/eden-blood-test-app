import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function GET() {
  console.log('Testing email configuration:', {
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    keyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10),
    supportEmail: process.env.SUPPORT_EMAIL
  });

  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

  const msg = {
    to: process.env.SUPPORT_EMAIL!,
    from: process.env.SUPPORT_EMAIL!,
    subject: 'Test Email from Eden Clinic',
    text: 'This is a test email to verify SendGrid integration.',
    html: '<strong>This is a test email to verify SendGrid integration.</strong>',
  };

  try {
    const response = await sgMail.send(msg);
    console.log('Test email sent:', {
      statusCode: response[0].statusCode,
      headers: response[0].headers,
    });
    
    return NextResponse.json({
      success: true,
      statusCode: response[0].statusCode,
      message: 'Test email sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending test email:', {
      message: error.message,
      response: error.response?.body,
      code: error.code,
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.body
    }, { status: 500 });
  }
}
