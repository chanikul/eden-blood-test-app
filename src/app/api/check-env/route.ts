import { NextRequest, NextResponse } from 'next/server';

export const GET = async () => {
  const envStatus = {
    stripe: {
      secretKey: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        preview: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...',
      },
      webhookSecret: {
        exists: !!process.env.STRIPE_WEBHOOK_SECRET,
        preview: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7) + '...',
      },
    },
    sendgrid: {
      apiKey: {
        exists: !!process.env.SENDGRID_API_KEY,
        preview: process.env.SENDGRID_API_KEY?.substring(0, 7) + '...',
      },
    },
    email: {
      supportEmail: {
        exists: !!process.env.SUPPORT_EMAIL,
        value: process.env.SUPPORT_EMAIL,
      },
    },
    database: {
      url: {
        exists: !!process.env.DATABASE_URL,
        preview: process.env.DATABASE_URL?.substring(0, 20) + '...',
      },
    },
  };

  console.log('Environment status:', envStatus);
  return NextResponse.json({ envStatus });
}
