'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  metadata: Record<string, string>;
  price: {
    id: string;
    unit_amount: number;
    currency: string;
  } | null;
  hidden: boolean;
}

interface DebugInfo {
  timestamp: string;
  environment: string;
  hasStripeKey: boolean;
  stripeKeyPrefix: string;
  url: string;
  steps: string[];
  errors: string[];
  productCounts: {
    total: number;
    bloodTests: number;
    withPrices: number;
    active: number;
    formatted: number;
  };
}

interface DebugResponse {
  products: Product[];
  debug: DebugInfo;
}

export default function DebugProductsPage() {
  const [regularProducts, setRegularProducts] = useState<Product[]>([]);
  const [debugProducts, setDebugProducts] = useState<Product[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState<{regular: boolean; debug: boolean}>({
    regular: true,
    debug: true
  });
  const [error, setError] = useState<{regular: string | null; debug: string | null}>({
    regular: null,
    debug: null
  });

  useEffect(() => {
    // Fetch from regular products API
    async function fetchRegularProducts() {
      try {
        console.log('Fetching from regular products API...');
        const res = await fetch('/api/products', {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Regular products API response:', data);
        setRegularProducts(data);
      } catch (err: any) {
        console.error('Error fetching regular products:', err);
        setError(prev => ({ ...prev, regular: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, regular: false }));
      }
    }
    
    // Fetch from debug products API
    async function fetchDebugProducts() {
      try {
        console.log('Fetching from debug products API...');
        const res = await fetch('/api/debug-products', {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        const data: DebugResponse = await res.json();
        console.log('Debug products API response:', data);
        setDebugProducts(data.products);
        setDebugInfo(data.debug);
      } catch (err: any) {
        console.error('Error fetching debug products:', err);
        setError(prev => ({ ...prev, debug: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, debug: false }));
      }
    }
    
    fetchRegularProducts();
    fetchDebugProducts();
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Blood Test Products Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regular Products API */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Regular Products API</h2>
          
          {loading.regular ? (
            <div className="flex items-center justify-center h-40">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : error.regular ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Error</p>
              <p>{error.regular}</p>
            </div>
          ) : (
            <>
              <p className="mb-2">Found {regularProducts.length} blood test products</p>
              
              {regularProducts.length === 0 ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                  <p className="font-bold">No products found</p>
                  <p>The regular products API returned an empty array</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hidden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regularProducts.map(product => (
                        <tr key={product.id}>
                          <td className="py-2 px-4 border-b border-gray-200">{product.name}</td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.price 
                              ? `${(product.price.unit_amount / 100).toFixed(2)} ${product.price.currency.toUpperCase()}`
                              : 'No price'}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.active ? '✅' : '❌'}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.hidden ? '✅' : '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Debug Products API */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Debug Products API</h2>
          
          {loading.debug ? (
            <div className="flex items-center justify-center h-40">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : error.debug ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Error</p>
              <p>{error.debug}</p>
            </div>
          ) : (
            <>
              <p className="mb-2">Found {debugProducts.length} blood test products</p>
              
              {debugProducts.length === 0 ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                  <p className="font-bold">No products found</p>
                  <p>The debug products API returned an empty array</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hidden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugProducts.map(product => (
                        <tr key={product.id}>
                          <td className="py-2 px-4 border-b border-gray-200">{product.name}</td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.price 
                              ? `${(product.price.unit_amount / 100).toFixed(2)} ${product.price.currency.toUpperCase()}`
                              : 'No price'}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.active ? '✅' : '❌'}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {product.hidden ? '✅' : '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Debug Info */}
              {debugInfo && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-2">Debug Information</h3>
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p><strong>Environment:</strong> {debugInfo.environment}</p>
                    <p><strong>Has Stripe Key:</strong> {debugInfo.hasStripeKey ? '✅' : '❌'}</p>
                    <p><strong>Stripe Key Prefix:</strong> {debugInfo.stripeKeyPrefix}</p>
                    <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                    
                    <div className="mt-4">
                      <h4 className="font-bold">Product Counts</h4>
                      <ul className="list-disc ml-5">
                        <li>Total Products: {debugInfo.productCounts.total}</li>
                        <li>Active Products: {debugInfo.productCounts.active}</li>
                        <li>Blood Test Products: {debugInfo.productCounts.bloodTests}</li>
                        <li>Products with Prices: {debugInfo.productCounts.withPrices}</li>
                        <li>Formatted Products: {debugInfo.productCounts.formatted}</li>
                      </ul>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-bold">Process Steps</h4>
                      <ol className="list-decimal ml-5">
                        {debugInfo.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    
                    {debugInfo.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold text-red-600">Errors</h4>
                        <ul className="list-disc ml-5">
                          {debugInfo.errors.map((error, index) => (
                            <li key={index} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
