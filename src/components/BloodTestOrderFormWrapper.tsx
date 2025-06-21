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
      
      // Track which endpoint we're using
      let currentEndpoint = '';
      let isLocalDev = process.env.NODE_ENV === 'development';
      
      try {
        console.log('Fetching blood tests from API...');
        console.log('Environment:', process.env.NODE_ENV);
        
        // Try local API first in development mode
        if (isLocalDev) {
          try {
            console.log('Trying local API endpoint first...');
            currentEndpoint = '/api/debug-products';
            
            console.log(`Fetching from ${currentEndpoint}...`);
            const localRes = await fetch(currentEndpoint, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              cache: 'no-store'
            });
            
            if (localRes.ok) {
              const data = await localRes.json();
              console.log('Local API response:', data);
              
              if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                console.log(`Successfully fetched ${data.products.length} blood tests from local API`);
                setProducts(data.products);
                return; // Exit early if successful
              } else {
                console.warn('Local API returned empty or invalid products array');
              }
            } else {
              console.warn(`Local API responded with status ${localRes.status}`);
            }
          } catch (localError) {
            console.warn('Error using local API endpoint:', localError);
          }
        }
        
        // Fall back to Netlify function endpoint
        currentEndpoint = '/.netlify/functions/blood-tests';
        console.log(`Falling back to Netlify function: ${currentEndpoint}...`);
        
        const res = await fetch(currentEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          // Prevent caching to ensure fresh data
          cache: 'no-store',
          // Add credentials to ensure cookies are sent
          credentials: 'same-origin'
        });
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => 'No response text');
          console.error(`API ${currentEndpoint} responded with status ${res.status}: ${errorText}`);
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        // Check content type to detect HTML responses
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.error('Received HTML response instead of JSON');
          const htmlContent = await res.text();
          console.error('HTML content preview:', htmlContent.substring(0, 200));
          throw new Error('Received HTML instead of JSON. The server might be redirecting to a login page.');
        }
        
        let responseText;
        try {
          // First get the raw text
          responseText = await res.clone().text();
          console.log('Response text preview:', responseText.substring(0, 100));
          
          // Then try to parse it as JSON
          const data = JSON.parse(responseText);
          console.log(`Received ${data.length} blood tests from API`);
          
          if (data.length === 0) {
            console.warn('API returned empty blood test array');
            setError('No blood tests available at this time');
          } else {
            setProducts(data);
          }
        } catch (jsonError: any) {
          console.error('JSON parsing error:', jsonError);
          console.error('Response text that failed to parse:', responseText);
          throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
        }
      } catch (apiError: any) {
        console.error('Error fetching blood tests:', {
          message: apiError.message,
          name: apiError.name,
          stack: apiError.stack,
          toString: apiError.toString(),
          // Additional debugging info
          endpoint: '/.netlify/functions/blood-tests',
          responseAvailable: apiError.response !== undefined,
          responseStatus: apiError.response?.status,
          responseStatusText: apiError.response?.statusText
        });
        
        // Try fallback mock data
        console.log('Using fallback mock data...');
        setError(`Could not load blood tests: ${apiError.message || 'Unknown error'}. Please try again later.`);
        
        // Use hardcoded mock data as last resort
        setProducts([
          {
            id: 'mock_prod_1',
            name: 'Mock Blood Test Basic',
            description: 'A basic blood test panel',
            active: true,
            metadata: { type: 'blood_test' },
            price: { id: 'mock_price_1', unit_amount: 9900, currency: 'gbp' },
            hidden: false
          },
          {
            id: 'mock_prod_2',
            name: 'Mock Blood Test Advanced',
            description: 'An advanced blood test panel',
            active: true,
            metadata: { type: 'blood_test' },
            price: { id: 'mock_price_2', unit_amount: 14900, currency: 'gbp' },
            hidden: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);
  
  // Add a retry button for users
  const handleRetry = () => {
    console.log('Manually retrying blood test fetch...');
    setLoading(true);
    setError(null);
    
    // Add a small delay before retrying
    setTimeout(() => {
      async function retryFetch() {
        try {
          // Try local API first in development mode
          const isLocalDev = process.env.NODE_ENV === 'development';
          let endpoint = isLocalDev ? '/api/debug-products' : '/.netlify/functions/blood-tests';
          console.log(`Retrying fetch from ${endpoint}...`);
          
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
            credentials: 'same-origin',
            // Add a cache-busting parameter
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          console.log(`Retry response status: ${res.status}`);
          
          if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
          
          // Check content type to detect HTML responses
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.error('Received HTML response instead of JSON on retry');
            const htmlContent = await res.text();
            console.error('HTML content preview:', htmlContent.substring(0, 200));
            throw new Error('Received HTML instead of JSON on retry. The server might be redirecting to a login page.');
          }
          
          // Store the current endpoint for error reporting
          const currentEndpoint = endpoint;
          
          const responseText = await res.text();
          try {
            const data = JSON.parse(responseText);
            console.log('Retry response data:', data);
            
            // Handle both formats: direct array or {products: array}
            const productsArray = Array.isArray(data) ? data : (data.products || []);
            console.log(`Retry successful: Received ${productsArray.length} blood tests`);
            
            setProducts(productsArray);
            setError(null);
          } catch (jsonError: any) {
            console.error('Retry JSON parsing error:', jsonError);
            throw new Error(`Failed to parse JSON response on retry`);
          }
        } catch (retryError: any) {
          console.error('Retry failed:', retryError);
          setError(`Retry failed: ${retryError.message}`);
          // Keep using the mock data that was already set
        } finally {
          setLoading(false);
        }
      }
      
      retryFetch();
    }, 500);
  };

  return (
    <div className="blood-test-order-form-wrapper">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2">Loading blood tests...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-amber-600">No blood tests are currently available.</p>
          <p className="text-gray-600 mt-2">Please check back later or contact support.</p>
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded text-left">
              <h3 className="font-bold">Debug Info:</h3>
              <p>Environment: {process.env.NODE_ENV}</p>
              <p>Products array length: {products.length}</p>
              <p>
                <a href="/debug-products" target="_blank" className="text-blue-600 underline">
                  View Debug Products Page
                </a>
              </p>
            </div>
          )}
        </div>
      ) : (
        <BloodTestOrderForm tests={products.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.id,
          price: product.price?.unit_amount ? product.price.unit_amount / 100 : 0,
          description: product.description || '',
          stripePriceId: product.price?.id || '',
          stripeProductId: product.id
        }))} />
      )}
    </div>
  );
}
