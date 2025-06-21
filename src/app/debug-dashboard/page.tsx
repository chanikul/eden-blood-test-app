'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DebugInfo {
  environment: string;
  nodeEnv: string;
  timestamp: string;
  stripeKeyPresent: boolean;
  supabaseUrlPresent: boolean;
  supabaseKeyPresent: boolean;
  sendgridKeyPresent: boolean;
}

export default function DebugDashboardPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        console.log('Fetching debug info...');
        const res = await fetch('/api/debug', {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Debug info:', data);
        setDebugInfo(data);
      } catch (err: any) {
        console.error('Error fetching debug info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDebugInfo();
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Eden Clinic Debug Dashboard</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span className="ml-2">Loading debug information...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : debugInfo ? (
        <div>
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p className="font-bold">Environment Information</p>
            <p>Environment: {debugInfo.environment}</p>
            <p>NODE_ENV: {debugInfo.nodeEnv}</p>
            <p>Timestamp: {debugInfo.timestamp}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">API Keys Status</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 ${debugInfo.stripeKeyPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Stripe API Key: {debugInfo.stripeKeyPresent ? 'Present' : 'Missing'}</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 ${debugInfo.supabaseUrlPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Supabase URL: {debugInfo.supabaseUrlPresent ? 'Present' : 'Missing'}</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 ${debugInfo.supabaseKeyPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Supabase Key: {debugInfo.supabaseKeyPresent ? 'Present' : 'Missing'}</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 ${debugInfo.sendgridKeyPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>SendGrid Key: {debugInfo.sendgridKeyPresent ? 'Present' : 'Missing'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Debug Pages</h2>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/debug-products" 
                    className="text-blue-600 hover:underline"
                  >
                    Debug Products Page
                  </Link>
                  <p className="text-sm text-gray-600">Test blood test product fetching from API</p>
                </li>
                <li>
                  <Link 
                    href="/debug-stripe-api" 
                    className="text-blue-600 hover:underline"
                  >
                    Debug Stripe API
                  </Link>
                  <p className="text-sm text-gray-600">Test Stripe API connection and products</p>
                </li>
                <li>
                  <Link 
                    href="/debug-stripe" 
                    className="text-blue-600 hover:underline"
                  >
                    Debug Stripe Environment
                  </Link>
                  <p className="text-sm text-gray-600">Check Stripe environment variables</p>
                </li>
                <li>
                  <Link 
                    href="/client/blood-tests/new" 
                    className="text-blue-600 hover:underline"
                  >
                    Blood Test Order Form
                  </Link>
                  <p className="text-sm text-gray-600">Test the actual blood test order form</p>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Troubleshooting Guide</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Empty Blood Test Dropdown</h3>
                <p className="text-sm text-gray-600">
                  If the blood test dropdown is empty, check the following:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Stripe API key is correctly set in environment variables</li>
                  <li>Blood test products exist in Stripe with metadata.type="blood_test"</li>
                  <li>Each blood test product has an active price</li>
                  <li>API routes are returning the correct data (check Debug Products page)</li>
                  <li>Network requests are not being blocked or returning errors</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold">Admin Login Issues</h3>
                <p className="text-sm text-gray-600">
                  If there are issues with admin login, check the following:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  <li>Supabase URL and key are correctly set in environment variables</li>
                  <li>Google OAuth is properly configured in Supabase</li>
                  <li>SafeAuthGuard component is correctly implemented in admin layout</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="flex space-x-4">
              <Link 
                href="/" 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Go to Homepage
              </Link>
              <Link 
                href="/admin" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Go to Admin
              </Link>
            </div>
          </div>
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
