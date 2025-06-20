import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(): Promise<NextResponse> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test required env vars
    const envVars = {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSendgridKey: !!process.env.SENDGRID_API_KEY,
    };

    return NextResponse.json({ 
      status: 'ok',
      databaseConnected: true,
      environmentVariables: envVars
    });
  } catch (error) {
    console.error('Configuration test failed:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
