'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase-client';

interface SafeAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SafeAuthGuard - A component that safely handles authentication state
 * and prevents React from crashing when session is null
 * 
 * Features:
 * - Safely handles null sessions
 * - Shows a loading state while checking auth
 * - Redirects to login if not authenticated
 * - Development mode bypass option
 * - Prevents React error #418 and INITIAL_SESSION null issues
 */
export function SafeAuthGuard({ children, fallback }: SafeAuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Safe initialization of Supabase client with error handling
  const getSupabase = () => {
    try {
      return getSupabaseClient();
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      setAuthError('Failed to initialize authentication client');
      return null;
    }
  };

  useEffect(() => {
    // Development mode bypass for easier local testing
    // Also add a temporary bypass for Vercel deployment testing
    const isDevMode = process.env.NODE_ENV === 'development';
    const isVercelPreview = typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('localhost'));
    
    if (isDevMode || isVercelPreview) {
      console.log('Development/Preview mode: Bypassing authentication check');
      setIsAuthenticated(true);
      setIsLoading(false);
      return () => {}; // Return empty cleanup function for development mode
    }

    // Flag to track if component is mounted
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setIsLoading(false);
          return;
        }

        // Get current session safely
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setAuthError(error.message);
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        // Check if user is authenticated and has the right provider
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
          
          // Check if user has the right domain (for Google auth)
          const email = session.user.email;
          const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];
          const isValidDomain = ALLOWED_DOMAINS.some(domain => email?.endsWith(`@${domain}`));
          
          if (isValidDomain) {
            if (isMounted) {
              setIsAuthenticated(true);
            }
          } else {
            console.warn('User does not have valid domain:', email);
            setAuthError(`You must use an @edenclinicformen.com or @edenclinic.co.uk email to access the admin area`);
            if (isMounted) {
              setIsAuthenticated(false);
            }
          }
        } else {
          console.log('No active session found');
          if (isMounted) {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthError('Failed to verify authentication status');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start the auth check process
    checkAuth();

    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log('SafeAuthGuard unmounting, cleanup initiated');
      isMounted = false;
    };
  }, []); // Remove router dependency to prevent unnecessary re-renders

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthenticated) {
    // If custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Use useEffect for navigation to avoid React errors
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        router.push('/admin/login');
      }
    }, [isLoading, isAuthenticated, router]);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
