// Force dynamic to ensure fresh data on each request
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import sgMail from '@sendgrid/mail';

// Define a type for the blood test data we're selecting
type BloodTestData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stripePriceId: string | null;
  stripeProductId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface EmailTest {
  success: boolean;
  error: string | null;
  messageId?: string;
  response?: any;
}

interface PrismaStatus {
  connected: boolean;
  error: string | null;
}

export async function GET(): Promise<NextResponse> {
  // Initialize response objects
  let bloodTests: BloodTestData[] = [];
  let emailTest: EmailTest = { success: false, error: null };
  let prismaStatus = { connected: false, error: null };
  
  try {
    // Check environment variables
    const envCheck = {
      sendgridKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 8) || 'not-set',
      supportEmail: process.env.SUPPORT_EMAIL || 'not-set',
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      vercelEnv: process.env.VERCEL_ENV || 'not-set',
      nodeEnv: process.env.NODE_ENV || 'not-set',
      timestamp: new Date().toISOString()
    };

    // Test Prisma connection
    try {
      // First check if we can connect
      await prisma.$connect();
      prismaStatus.connected = true;
      
      // Try to get all blood tests
      bloodTests = await prisma.bloodTest.findMany({
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
      }) || [];
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      prismaStatus.error = dbError.message || 'Unknown database error';
      // Continue execution to test other services
    }

    // Test SendGrid connection
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
          response: {
            statusCode: response[0]?.statusCode,
            headers: response[0]?.headers
          }
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
