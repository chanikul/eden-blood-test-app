'use client';

import React, { useEffect, useState } from 'react';
import { BloodTestOrderForm } from './forms/BloodTestOrderForm';

export function BloodTestOrderFormWrapper() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products');
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

  const handleSuccess = (orderId: string) => {
    // Success will be handled by the form component's redirect
  };

  const handleError = (error: Error) => {
    // Error will be handled by the form component's toast
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="text-center mb-8">
          <img
            src="/Eden-Clinic-For-White-Background.png"
            alt="Eden Clinic"
            className="h-16 w-auto object-contain mx-auto dark:invert mb-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const title = document.createElement('h1');
              title.className = 'text-3xl font-semibold text-[rgb(var(--foreground))]';
              title.textContent = 'Eden Clinic';
              e.currentTarget.parentElement?.appendChild(title);
            }}
          />
          <div className="form-header">
            <h1>Order Your Eden Clinic Blood Test Kit</h1>
            <p>We'll send your kit to you after checkout. You can use your preferred clinic for the blood draw.</p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading blood test products…</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No blood test products available.</div>
        ) : (
          <BloodTestOrderForm tests={products} onSuccess={handleSuccess} onError={handleError} />
        )}
      </div>
    </div>
  );
}

