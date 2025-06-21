import { NextRequest, NextResponse } from 'next/server';

// Mock blood test products for testing
const mockProducts = [
  {
    id: 'mock_prod_1',
    name: 'Mock Blood Test Basic',
    description: 'A basic blood test panel',
    active: true,
    metadata: { type: 'blood_test' },
    price: { id: 'mock_price_1', unit_amount: 9900, currency: 'gbp' },
    hidden: false
  },
  {
    id: 'mock_prod_2',
    name: 'Mock Blood Test Advanced',
    description: 'An advanced blood test panel',
    active: true,
    metadata: { type: 'blood_test' },
    price: { id: 'mock_price_2', unit_amount: 14900, currency: 'gbp' },
    hidden: false
  },
  {
    id: 'mock_prod_3',
    name: 'Mock Blood Test Premium',
    description: 'A comprehensive blood test panel',
    active: true,
    metadata: { type: 'blood_test' },
    price: { id: 'mock_price_3', unit_amount: 19900, currency: 'gbp' },
    hidden: false
  }
];

// Route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest): Promise<NextResponse> {
  console.log('Mock Products API called:', req.url);
  
  // Always return mock data
  return NextResponse.json(mockProducts, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}
