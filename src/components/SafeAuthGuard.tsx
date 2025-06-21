'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

interface SafeAuthGuardProps {
  children: React.ReactNode;
}

export default function SafeAuthGuard({ children }: SafeAuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // Allow bypassing auth in development mode with a special URL parameter
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    async function checkSession() {
      try {
        // Check if we're in development mode and want to bypass auth
        if (isDevelopment && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('bypass_auth') === 'true') {
            console.log('Development mode: Bypassing auth check');
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // Get session safely
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Authentication error. Please try logging in again.');
          setIsAuthenticated(false);
        } else if (!data.session) {
          console.log('No active session found');
          setIsAuthenticated(false);
        } else {
          console.log('Valid session found');
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Unexpected error during auth check:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, [supabase, isDevelopment]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
          <p className="font-bold">Authentication Error</p>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/admin/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    // Redirect to login page
    router.push('/admin/login');
    
    // Show a loading message while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
