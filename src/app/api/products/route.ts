import { NextRequest, NextResponse } from 'next/server';
import { fetchBloodTestProducts } from '@/lib/services/stripe-products';

// Simple in-memory cache (per serverless instance)
let cache: any[] = [];
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const now = Date.now();
  const url = new URL(req.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  if (cache.length > 0 && now - lastFetch < CACHE_TTL && !isAdmin) {
    return NextResponse.json(cache);
  }

  try {
    const products = await fetchBloodTestProducts({ fetchAll: isAdmin });
    if (!isAdmin) {
      cache = products;
      lastFetch = now;
    }
    return NextResponse.json(products);
  } catch (e: any) {
    console.error('Failed to fetch Stripe products:', e);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
