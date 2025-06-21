'use client';

import { useState, useEffect } from 'react';

interface ApiResponse {
  endpoint: string;
  status: number;
  statusText: string;
  ok: boolean;
  contentType?: string | null;
  data?: any;
  error?: string;
  responseText?: string;
}

export default function DebugPage() {
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testEndpoints() {
      const endpoints = [
        '/api/products',
        '/api/mock-products',
        '/.netlify/functions/blood-tests',
        '/api/debug'
      ];

      const results: ApiResponse[] = [];

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          
          const contentType = response.headers.get('content-type');
          let data;
          let responseText;
          
          try {
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
            } else {
              responseText = await response.text();
            }
          } catch (parseError) {
            try {
              responseText = await response.text();
            } catch (textError) {
              responseText = 'Failed to get response text';
            }
          }
          
          results.push({
            endpoint,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType,
            data,
            responseText
          });
        } catch (error: any) {
          results.push({
            endpoint,
            status: 0,
            statusText: 'Network Error',
            ok: false,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      return results;
    }

    testEndpoints()
      .then(results => {
        setResponses(results);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to test endpoints');
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Endpoint Debug</h1>
      
      {loading && <p>Testing endpoints...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="space-y-6">
          {responses.map((response, index) => (
            <div key={index} className="border rounded p-4">
              <h2 className="text-xl font-semibold">{response.endpoint}</h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>Status:</div>
                <div className={response.ok ? 'text-green-600' : 'text-red-600'}>
                  {response.status} {response.statusText}
                </div>
                
                <div>Content Type:</div>
                <div>{response.contentType || 'N/A'}</div>
                
                {response.error && (
                  <>
                    <div>Error:</div>
                    <div className="text-red-600">{response.error}</div>
                  </>
                )}
              </div>
              
              {response.data && (
                <div className="mt-4">
                  <h3 className="font-medium">Response Data:</h3>
                  <pre className="bg-gray-100 p-2 mt-1 overflow-auto max-h-60 text-xs">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {response.responseText && (
                <div className="mt-4">
                  <h3 className="font-medium">Response Text:</h3>
                  <div className="bg-gray-100 p-2 mt-1 overflow-auto max-h-60 text-xs">
                    {response.responseText.length > 500 
                      ? response.responseText.substring(0, 500) + '...' 
                      : response.responseText}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
