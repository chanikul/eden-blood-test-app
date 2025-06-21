import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log the request for debugging
  console.log('Products API middleware:', request.nextUrl.pathname);
  
  // Handle the trailing slash issue
  if (request.nextUrl.pathname === '/api/products') {
    // Rewrite the URL instead of redirecting
    const url = request.nextUrl.clone();
    url.pathname = '/api/products/';
    return NextResponse.rewrite(url);
  }
  
  // Add CORS headers to allow requests from any origin
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: ['/api/products', '/api/products/', '/api/mock-products'],
};
