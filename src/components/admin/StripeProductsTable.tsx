"use client";

import React, { useEffect, useState } from 'react';

interface StripeProduct {
  id: string;
  name: string;
  price: number;
  priceId: string;
  currency: string;
  active: boolean;
  created: number;
  hidden: boolean;
}

export default function StripeProductsTable() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products?admin=1');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const sorted = [...products].sort((a, b) => b.created - a.created);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Stripe Blood Test Products</h2>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Product Name</th>
              <th className="px-2 py-1 border">Price</th>
              <th className="px-2 py-1 border">Active</th>
              <th className="px-2 py-1 border">Hidden</th>
              <th className="px-2 py-1 border">Product ID</th>
              <th className="px-2 py-1 border">Price ID</th>
              <th className="px-2 py-1 border">Created</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'bg-gray-100 text-gray-400'}>
                <td className="px-2 py-1 border">{p.name}</td>
                <td className="px-2 py-1 border">£{p.price.toFixed(2)} {p.currency.toUpperCase()}</td>
                <td className="px-2 py-1 border text-center">{p.active ? '✅' : '❌'}</td>
                <td className="px-2 py-1 border text-center">{p.hidden ? '🙈' : ''}</td>
                <td className="px-2 py-1 border font-mono">{p.id}</td>
                <td className="px-2 py-1 border font-mono">{p.priceId}</td>
                <td className="px-2 py-1 border">{new Date(p.created * 1000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
