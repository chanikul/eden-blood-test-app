import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const body = await req.text();

  console.log('Test webhook received:', {
    path: req.url,
    method: req.method,
    signature: signature?.substring(0, 20) + '...',
    body: body.substring(0, 100) + '...'
  });

  return NextResponse.json({ received: true });
}
