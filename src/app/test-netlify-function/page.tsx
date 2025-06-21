'use client';

import React, { useState, useEffect } from 'react';

export default function TestNetlifyFunction() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  async function fetchBloodTests() {
    setLoading(true);
    setError(null);
    setData(null);
    setRawResponse(null);
    
    try {
      console.log('Fetching from Netlify function...');
      const response = await fetch('/.netlify/functions/blood-tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        credentials: 'same-origin'
      });
      
      // Get the raw response text first
      const responseText = await response.text();
      setRawResponse(responseText);
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response text preview:', responseText.substring(0, 200));
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Try to parse as JSON
      try {
        const parsedData = JSON.parse(responseText);
        setData(parsedData);
      } catch (jsonError: any) {
        console.error('JSON parsing error:', jsonError);
        throw new Error(`Failed to parse JSON: ${jsonError.message}`);
      }
    } catch (err: any) {
      console.error('Error fetching blood tests:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBloodTests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Netlify Function: Blood Tests</h1>
      
      <div className="mb-4">
        <button 
          onClick={fetchBloodTests}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Blood Tests Data</h2>
          {data && (
            <div className="mb-6">
              <p className="mb-2">Found {data.length} blood tests</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.map((product: any) => (
                  <div key={product.id} className="border rounded p-4 bg-white shadow-sm">
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <p className="mt-2">
                      Price: £{(product.price?.unit_amount / 100).toFixed(2)}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>ID: {product.id}</p>
                      <p>Active: {product.active ? 'Yes' : 'No'}</p>
                      <p>Hidden: {product.hidden ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Raw Response</h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              <pre className="text-xs">{rawResponse}</pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-blue-50 p-4 rounded border border-blue-200">
        <h2 className="text-lg font-semibold mb-2">Environment Information</h2>
        <p className="mb-2">
          <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
        </p>
        <p className="mb-2">
          <strong>NEXT_PUBLIC_BASE_URL:</strong> {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}
        </p>
        <p className="mb-2">
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
        </p>
        <p className="mb-2">
          <strong>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:</strong> {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'Not set'}
        </p>
      </div>
    </div>
  );
}
