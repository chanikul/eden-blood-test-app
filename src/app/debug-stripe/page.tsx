'use client';

import { useState, useEffect } from 'react';

export default function DebugStripePage() {
  const [stripeKey, setStripeKey] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<any>(null);

  // Fetch environment variables from debug endpoint
  useEffect(() => {
    async function fetchEnvVars() {
      try {
        const res = await fetch('/api/debug');
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setEnvVars(data);
        
        // If we have a Stripe key in the response, use it
        if (data.stripe?.stripeSecretKey) {
          setStripeKey(data.stripe.stripeSecretKey);
        }
      } catch (err: any) {
        console.error('Error fetching environment variables:', err);
      }
    }
    
    fetchEnvVars();
  }, []);

  const testStripeConnection = async () => {
    if (!stripeKey) {
      setError('Please enter a Stripe API key');
      return;
    }
    
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      // Test the connection by fetching products
      const response = await fetch('/api/debug-products');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      console.error('Error testing Stripe connection:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stripe API Debug Tool</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4">Environment Variables</h2>
        
        {envVars ? (
          <div className="overflow-auto max-h-96">
            <h3 className="text-xl font-semibold mb-2">Environment</h3>
            <pre className="bg-gray-100 p-4 rounded mb-4">
              {JSON.stringify(envVars.environment, null, 2)}
            </pre>
            
            <h3 className="text-xl font-semibold mb-2">Stripe Configuration</h3>
            <pre className="bg-gray-100 p-4 rounded mb-4">
              {JSON.stringify(envVars.stripe, null, 2)}
            </pre>
            
            <h3 className="text-xl font-semibold mb-2">Auth Configuration</h3>
            <pre className="bg-gray-100 p-4 rounded mb-4">
              {JSON.stringify(envVars.auth, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Loading environment variables...</p>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4">Test Stripe Connection</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stripeKey">
            Stripe Secret Key (from environment)
          </label>
          <input
            id="stripeKey"
            type="text"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="sk_test_..."
            disabled
          />
          <p className="text-sm text-gray-500 mt-1">
            This key is loaded from your environment and cannot be changed here for security reasons.
          </p>
        </div>
        
        <button
          onClick={testStripeConnection}
          disabled={loading || !stripeKey}
          className={`px-4 py-2 rounded ${
            loading || !stripeKey
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {testResult && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Test Results</h3>
            
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <p className="font-bold">Connection Successful</p>
              <p>Successfully connected to Stripe API and retrieved products.</p>
            </div>
            
            <div className="overflow-auto max-h-96">
              <h4 className="font-bold mb-2">Products Found: {testResult.products?.length || 0}</h4>
              
              {testResult.products?.length > 0 ? (
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.products.map((product: any) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
                  <p className="font-bold">No products found</p>
                  <p>The API returned an empty array of products.</p>
                </div>
              )}
              
              <h4 className="font-bold mt-4 mb-2">Debug Information</h4>
              <pre className="bg-gray-100 p-4 rounded">
                {JSON.stringify(testResult.debug, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
