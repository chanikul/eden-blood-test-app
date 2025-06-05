import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import sgMail from '@sendgrid/mail';

interface EmailTest {
  success: boolean;
  error: string | null;
  statusCode?: number;
  headers?: Record<string, any>;
  response?: any;
}

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      sendgridKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 8) || 'not-set',
      supportEmail: process.env.SUPPORT_EMAIL || 'not-set',
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      timestamp: new Date().toISOString()
    };

    // Get all blood tests
    const bloodTests = await prisma.bloodTest.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stripePriceId: true,
        stripeProductId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Test SendGrid connection
    let emailTest: EmailTest = { success: false, error: null };
    if (process.env.SENDGRID_API_KEY && process.env.SUPPORT_EMAIL) {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const response = await sgMail.send({
          to: process.env.SUPPORT_EMAIL,
          from: process.env.SUPPORT_EMAIL,
          subject: 'Eden Clinic - Email Test',
          text: 'This is a test email to verify SendGrid integration.',
          html: '<strong>This is a test email to verify SendGrid integration.</strong>'
        });
        emailTest = { 
          success: true, 
          error: null,
          statusCode: response[0]?.statusCode,
          headers: response[0]?.headers
        };
      } catch (error: any) {
        emailTest = { 
          success: false, 
          error: error.message,
          response: error.response?.body
        };
      }
    }

    return NextResponse.json({
      envCheck,
      bloodTests,
      emailTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
