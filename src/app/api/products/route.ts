import { NextRequest, NextResponse } from 'next/server';
import { fetchBloodTestProducts } from '../../../../lib/services/stripe-products';

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
    // For admin users, fetch all products including inactive ones
    // For regular users, only fetch active products
    const products = await fetchBloodTestProducts({ fetchAll: isAdmin });
    
    // For non-admin users, filter out products with hidden=true
    const filteredProducts = isAdmin ? products : products.filter(p => p && p.active && !p.hidden);
    
    if (!isAdmin) {
      cache = filteredProducts;
      lastFetch = now;
    }
    return NextResponse.json(filteredProducts);
  } catch (e: any) {
    console.error('Failed to fetch Stripe products:', e);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
