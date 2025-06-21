'use client';

import { useState, useEffect } from 'react';

interface StripeProduct {
  id: string;
  name: string;
  active: boolean;
  metadata: Record<string, string>;
  price: {
    id: string;
    unit_amount: number;
    currency: string;
  } | null;
}

interface StripeDebugResponse {
  success: boolean;
  timestamp: string;
  environment: string;
  stripeAccount: {
    id: string;
    email: string;
    country: string;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
  };
  products: {
    total: number;
    bloodTests: number;
    withPrices: number;
    active: number;
  };
  bloodTestProducts: StripeProduct[];
  error?: string;
  type?: string;
}

export default function DebugStripeApiPage() {
  const [stripeData, setStripeData] = useState<StripeDebugResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStripeData() {
      try {
        console.log('Fetching Stripe debug data...');
        const res = await fetch('/api/debug-stripe', {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Stripe debug data:', data);
        setStripeData(data);
      } catch (err: any) {
        console.error('Error fetching Stripe debug data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStripeData();
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stripe API Debug Page</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span className="ml-2">Loading Stripe data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : stripeData ? (
        <div>
          {stripeData.error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Stripe API Error</p>
              <p>{stripeData.error}</p>
              <p>Error Type: {stripeData.type || 'Unknown'}</p>
            </div>
          ) : (
            <>
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
                <p className="font-bold">Stripe API Connected Successfully</p>
                <p>Environment: {stripeData.environment}</p>
                <p>Timestamp: {stripeData.timestamp}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Stripe Account</h2>
                  <p><strong>ID:</strong> {stripeData.stripeAccount.id}</p>
                  <p><strong>Email:</strong> {stripeData.stripeAccount.email}</p>
                  <p><strong>Country:</strong> {stripeData.stripeAccount.country}</p>
                  <p><strong>Details Submitted:</strong> {stripeData.stripeAccount.detailsSubmitted ? 'Yes' : 'No'}</p>
                  <p><strong>Charges Enabled:</strong> {stripeData.stripeAccount.chargesEnabled ? 'Yes' : 'No'}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold mb-4">Product Summary</h2>
                  <p><strong>Total Products:</strong> {stripeData.products.total}</p>
                  <p><strong>Blood Test Products:</strong> {stripeData.products.bloodTests}</p>
                  <p><strong>Products with Prices:</strong> {stripeData.products.withPrices}</p>
                  <p><strong>Active Products:</strong> {stripeData.products.active}</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Blood Test Products</h2>
                
                {stripeData.bloodTestProducts.length === 0 ? (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <p className="font-bold">No blood test products found</p>
                    <p>Make sure you have products with metadata.type = "blood_test" in your Stripe account.</p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stripeData.bloodTestProducts.map(product => (
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
                              {product.metadata?.type || 'No type'}
                            </td>
                            <td className="py-2 px-4 border-b border-gray-200">
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(product.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Debug Actions</h2>
                <div className="flex space-x-4">
                  <a 
                    href="/debug-products" 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    View Debug Products Page
                  </a>
                  <a 
                    href="/" 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Go to Homepage
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p className="font-bold">No data received</p>
          <p>The API response was empty. Please check the server logs for more information.</p>
        </div>
      )}
    </div>
  );
}
