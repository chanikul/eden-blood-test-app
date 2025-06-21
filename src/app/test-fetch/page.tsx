'use client';

import { useState, useEffect } from 'react';

export default function TestFetchPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchStartTime, setFetchStartTime] = useState<number | null>(null);
  const [fetchEndTime, setFetchEndTime] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      const startTime = Date.now();
      setFetchStartTime(startTime);
      
      try {
        console.log('Starting fetch test...');
        const response = await fetch('/.netlify/functions/blood-tests', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        const endTime = Date.now();
        setFetchEndTime(endTime);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No response text');
          throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }
        
        const jsonData = await response.json();
        console.log('Fetch successful:', jsonData);
        setData(jsonData);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Unknown error occurred');
        setFetchEndTime(Date.now());
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Netlify Function Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Request Details</h2>
        <div><strong>URL:</strong> /.netlify/functions/blood-tests</div>
        <div><strong>Method:</strong> GET</div>
        <div><strong>Headers:</strong> Accept: application/json, Content-Type: application/json</div>
        {fetchStartTime && <div><strong>Started at:</strong> {new Date(fetchStartTime).toLocaleTimeString()}</div>}
        {fetchEndTime && <div><strong>Completed at:</strong> {new Date(fetchEndTime).toLocaleTimeString()}</div>}
        {fetchStartTime && fetchEndTime && (
          <div><strong>Duration:</strong> {fetchEndTime - fetchStartTime}ms</div>
        )}
      </div>
      
      {loading && <div className="text-blue-600 font-semibold">Loading data...</div>}
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <h2 className="text-red-700 font-semibold mb-2">Error</h2>
          <div className="text-red-600">{error}</div>
        </div>
      )}
      
      {data && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Response Data</h2>
          <div className="bg-white border rounded p-4 overflow-auto max-h-96">
            <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
          </div>
          
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Products Found: {data.length}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(data) && data.map((product: any) => (
                <div key={product.id} className="border rounded p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <div className="text-sm text-gray-600 mb-2">{product.description}</div>
                  <div><strong>ID:</strong> {product.id}</div>
                  <div><strong>Price:</strong> {product.price ? `${(product.price.unit_amount / 100).toFixed(2)} ${product.price.currency.toUpperCase()}` : 'No price'}</div>
                  <div><strong>Hidden:</strong> {product.hidden ? 'Yes' : 'No'}</div>
                  <div className="mt-2">
                    <strong>Metadata:</strong>
                    <pre className="text-xs bg-gray-50 p-2 mt-1">{JSON.stringify(product.metadata, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
