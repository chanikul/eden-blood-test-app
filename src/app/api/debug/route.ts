// /src/app/api/debug/route.ts - Clean debug route for local development
import { NextResponse } from 'next/server';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('Local debug API route called');
  
  // Get all environment variable names (without values for security)
  const envVarNames = Object.keys(process.env).sort();
  
  // Return environment variables for debugging with a flat structure
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    baseUrl: process.env.BASE_URL || 'not set',
    publicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
    supabaseUrlPresent: !!process.env.SUPABASE_URL,
    supabaseKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
    sendgridKeyPresent: !!process.env.SENDGRID_API_KEY,
    allEnvVars: envVarNames,
    requestPath: '/api/debug',
    requestTimestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
