'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setError('Missing session_id parameter. Please return to the checkout page.');
      setLoading(false);
      return;
    }

    console.log('Processing payment with session_id:', sessionId);
    
    // Use XMLHttpRequest for better control over the response handling
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/finalize-order?session_id=${encodeURIComponent(sessionId)}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;
    
    // Set a timeout to prevent hanging indefinitely
    const timeoutId = setTimeout(() => {
      if (xhr.readyState < 4) {
        xhr.abort();
        setError('Request timed out. Please check your order status in your account or contact support.');
        setLoading(false);
      }
    }, 30000); // 30 second timeout
    
    // Handle the response
    xhr.onload = function() {
      clearTimeout(timeoutId);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('Received response data:', data);
          
          if (data.success && data.redirectTo) {
            console.log('Redirect URL received:', data.redirectTo);
            setRedirectUrl(data.redirectTo);
            
            // Store account creation status in localStorage before redirecting
            if (data.accountCreated !== undefined) {
              console.log('Account created status:', data.accountCreated);
              localStorage.setItem('eden_account_created', data.accountCreated.toString());
            }
            
            // Use a slight delay to ensure state updates complete
            setTimeout(() => {
              console.log('Executing redirect to:', data.redirectTo);
              window.location.replace(data.redirectTo);
            }, 100);
          } else if (data.error) {
            console.error('Error in response:', data.error);
            setError(data.error);
            setLoading(false);
          } else {
            console.error('Unexpected response format:', data);
            setError('Unexpected server response format. Please contact support.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error parsing JSON:', err);
          setError('Invalid server response. Please contact support.');
          setLoading(false);
        }
      } else {
        console.error('HTTP error:', xhr.status, xhr.statusText);
        setError(`Server error (${xhr.status}): ${xhr.statusText || 'Unknown error'}. Please try again or contact support.`);
        setLoading(false);
      }
    };
    
    // Handle network errors
    xhr.onerror = function() {
      clearTimeout(timeoutId);
      console.error('Network error occurred');
      setError('Network error. Please check your internet connection and try again.');
      setLoading(false);
    };
    
    // Send the request
    xhr.send();
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      xhr.abort(); // Abort the request if the component unmounts
    };
  }, [searchParams]); // Remove router from dependencies as it's not used

  // If we have a redirect URL but haven't redirected yet, force the redirect
  useEffect(() => {
    if (redirectUrl) {
      console.log('Backup redirect trigger to:', redirectUrl);
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Finalizing your order...</h2>
        <p className="text-gray-500 text-center">Please wait while we complete your order and set up your account.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-gray-500 text-center">{error}</p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
      <p className="text-gray-500 text-center">Please wait while we redirect you to the next page.</p>
    </div>
  );
}
