import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    // Return the API key (it's safe since it's a public key meant for browser use)
    return NextResponse.json({ 
      apiKey,
      keyExists: !!apiKey,
      keyLength: apiKey.length,
      keyPrefix: apiKey ? apiKey.substring(0, 4) : null
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in get-maps-key API:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve Google Maps API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
    });
  }
}
