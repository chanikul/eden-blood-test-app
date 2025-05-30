import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Forward the request to the Stripe webhook handler
  const stripeResponse = await fetch(new URL('/api/webhooks/stripe', req.url), {
    method: 'POST',
    headers: req.headers,
    body: req.body
  });

  return stripeResponse;
}
