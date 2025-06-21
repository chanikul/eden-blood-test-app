// netlify/functions/debug-env.js
exports.handler = async function(event, context) {
  // Add CORS headers to ensure the endpoint is accessible
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Create response with environment information
    const response = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        SUPABASE_URL: process.env.SUPABASE_URL || 'missing',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'exists' : 'missing',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'missing',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'exists' : 'missing',
        BASE_URL: process.env.BASE_URL || 'missing',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'exists' : 'missing',
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'exists' : 'missing',
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'missing',
        SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'missing'
      },
      request: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };
  } catch (error) {
    console.error('Error in debug-env function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
