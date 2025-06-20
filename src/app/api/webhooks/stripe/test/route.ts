import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const POST = async (request: NextRequest) => {
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const body = await request.text();

  console.log('Test webhook received:', {
    path: request.url,
    method: request.method,
    signature: signature?.substring(0, 20) + '...',
    body: body.substring(0, 100) + '...'
  });

  return NextResponse.json({ received: true });
}