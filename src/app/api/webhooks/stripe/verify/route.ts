import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const body = await req.text();

  console.log('=== WEBHOOK VERIFY TEST ===');
  console.log('Request details:', {
    url: req.url,
    method: req.method,
    headers: {
      'stripe-signature': signature?.substring(0, 20) + '...',
      'content-type': headersList.get('content-type'),
    }
  });

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: { message: 'Missing stripe-signature header' } },
      { status: 400 }
    );
  }

  try {
    console.log('Verifying webhook signature with secret:', STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...');
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook signature verified successfully!');
    console.log('Event:', {
      id: event.id,
      type: event.type,
      apiVersion: event.api_version,
      created: new Date(event.created * 1000).toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Webhook signature verified',
      event: {
        id: event.id,
        type: event.type
      }
    });
  } catch (error: any) {
    console.error('=== WEBHOOK VERIFICATION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      type: error.type
    });
    
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 400 }
    );
  }
}
