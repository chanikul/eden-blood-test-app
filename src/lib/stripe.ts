import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use type assertion to avoid TypeScript errors with different Stripe versions
  apiVersion: '2023-10-16' as any,
  typescript: true,
});
