# Stripe Integration Setup Guide

This document outlines how to set up and configure Stripe for the Eden Clinic application.

## Prerequisites

- Stripe account (either test or production)
- Access to Stripe Dashboard
- Eden Clinic application codebase

## Setup Steps

### 1. Create a Stripe Account

1. Go to [Stripe's website](https://stripe.com/) and sign up for an account
2. Complete the verification process
3. Toggle between test and live modes as needed

### 2. Get API Keys

1. In the Stripe Dashboard, go to "Developers" > "API keys"
2. Note down the following keys:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)
   - Webhook signing secret (for webhook verification)

### 3. Configure Products and Prices

#### Blood Test Products Setup

1. In the Stripe Dashboard, go to "Products"
2. Click "Add product"
3. For each blood test product:
   - Enter the product name (e.g., "Essential Blood Test")
   - Add a description
   - Upload an image if available
   - Set the price (one-time)
   - **Important**: Add metadata with key `type` and value `blood_test` (this is required for products to appear in the dropdown)
   - Optional: Add metadata with key `hidden` and value `true` to hide a product from customers (admin users can still see it)
   - Ensure the product is marked as "Active"
   - Click "Save product"

Example blood test products:
- Essential Blood Test
- Advanced Blood Test
- Premium Blood Test
- Ultimate Blood Test

### 4. Set Up Webhooks

1. In the Stripe Dashboard, go to "Developers" > "Webhooks"
2. Click "Add endpoint"
3. Enter your webhook URL: `https://eden-clinic-blood-test-app.windsurf.build/api/webhooks/stripe`
4. Select the following events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Note down the signing secret

### 5. Update Environment Variables

Add the following environment variables to your `.env` file:

```
STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
```

### 6. Test the Integration

1. Use Stripe's test cards to simulate payments:
   - Success: `4242 4242 4242 4242`
   - Requires authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 9995`
2. Test the checkout flow in development mode
3. Verify webhook events are being received and processed correctly

## Implementation Details

### Key Files

- `/src/lib/stripe.ts` - Main Stripe client initialization
- `/src/lib/services/stripe-products.ts` - Fetching and processing Stripe products
- `/src/app/api/products/route.ts` - API endpoint for fetching blood test products
- `/src/app/api/mock-products/route.ts` - Fallback API for mock blood test products
- `/src/app/api/webhooks/stripe/route.ts` - Webhook handler for Stripe events
- `/netlify/functions/blood-tests.js` - Netlify serverless function for blood test products
- `/src/components/BloodTestOrderFormWrapper.tsx` - Frontend component that fetches products

### API Architecture

#### Server-Side API Routes

The application uses Next.js 14 App Router API routes to handle Stripe API calls server-side, avoiding CORS issues:

1. **Primary API Route**: `/api/products`
   - Fetches blood test products from Stripe using the secret key
   - Filters products by `metadata.type === 'blood_test'`
   - Implements 5-minute caching to reduce Stripe API calls
   - Returns properly formatted JSON with CORS headers
   - Falls back to mock data if Stripe API fails

2. **Fallback API Route**: `/api/mock-products`
   - Provides hardcoded blood test products for development and fallback

3. **Netlify Function**: `/.netlify/functions/blood-tests`
   - Alternative endpoint that can be used if Next.js API routes have issues
   - Implements similar logic to the primary API route

### API Version

The application uses Stripe API version `2023-10-16`. This is configured in all Stripe client initializations.

### Route Segment Configuration

The API routes use the following Next.js 14 segment configuration:

```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
```

This ensures proper server-side execution and prevents unwanted caching issues.

## Troubleshooting

### Common Issues

1. **Empty Blood Test Dropdown**: 
   - Verify products exist in Stripe
   - Ensure products have `metadata.type = 'blood_test'` (this is required for filtering)
   - Check products are marked as "Active"
   - Confirm products have associated prices
   - Check browser console for API fetch errors
   - Verify the `/api/products` endpoint returns data correctly

2. **CORS Issues**:
   - The application uses server-side API routes to avoid CORS problems
   - If you see CORS errors, ensure the frontend is using `/api/products` and not calling Stripe directly
   - Check that the API route includes proper CORS headers
   - For local development, ensure the middleware is configured to exclude API routes

3. **API Route Redirects**:
   - If API routes return HTML instead of JSON, check the middleware configuration
   - Ensure `/api/*` paths are excluded from authentication middleware
   - Use the debug page at `/debug` to test API endpoints

4. **Webhook Failures**:
   - Verify the webhook URL is correct
   - Check the webhook signing secret is correctly set
   - Ensure the webhook endpoint is accessible

5. **Payment Failures**:
   - Check Stripe Dashboard for error messages
   - Verify the payment flow in test mode
   - Ensure the correct API keys are being used

### Debug Tools

1. **Debug Page**:
   - Visit `/debug` in the application to test API endpoints
   - The debug page shows responses from multiple endpoints:
     - `/api/products` - Primary API endpoint
     - `/.netlify/functions/blood-tests` - Netlify function endpoint
     - `/api/mock-products` - Mock products endpoint
     - `/api/debug` - Environment and configuration debug endpoint

2. **API Debug Endpoint**:
   - The `/api/debug` endpoint provides information about environment variables and configuration
   - It logs partial API keys (first few characters) for verification
   - Useful for diagnosing deployment issues

3. **Diagnostic Scripts**:
   - Run the diagnostic script to list Stripe products:
     ```bash
     node scripts/list-stripe-products.js
     ```
   - This script shows all products and their metadata

4. **Logging**:
   - Check server logs for detailed product information
   - API routes include extensive logging of product data and errors
   - Frontend component logs fetch attempts and responses

5. **Stripe Testing**:
   - Use Stripe CLI to test webhooks locally
   - Use Stripe Dashboard to view test events and logs

## Production Deployment Solution

### CORS and API Route Issues

When deploying to production, we encountered issues with the Next.js API routes being redirected by the middleware, causing CORS errors when fetching blood test products. Here's how we solved it:

1. **Middleware Configuration**:
   - Updated the middleware matcher to properly exclude API routes:
   ```typescript
   export const config = {
     matcher: [
       '/admin/:path*',
       '/client/:path*',
       '/change-password',
       '/api/payment-methods(.*)*',
       '/((?!api/|_next/|.netlify/functions/).)*'
     ],
   }
   ```
   - This ensures API routes aren't redirected to the authentication flow

2. **Netlify Configuration**:
   - Added `force = true` to API redirects in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api/:splat"
     status = 200
     force = true
   ```

3. **Fallback Solution**:
   - Created a direct Netlify serverless function at `/.netlify/functions/blood-tests`
   - Updated the frontend component to fetch from this endpoint instead of the Next.js API route
   - This bypasses any potential middleware or routing issues

4. **Debug Tools**:
   - Created a debug page at `/debug` that tests all API endpoints
   - Added a test API function at `/.netlify/functions/test-api` to verify environment variables

### Current Working Solution

The most reliable solution in production is to use the Netlify function directly:

```typescript
// In BloodTestOrderFormWrapper.tsx
const endpoint = '/.netlify/functions/blood-tests';
const res = await fetch(endpoint, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  cache: 'no-store'
});
```

This approach avoids any potential issues with Next.js API routes and middleware redirects.

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
