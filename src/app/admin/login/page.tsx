'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getSupabaseClient } from '../../../lib/supabase-client'

// Get the singleton instance of Supabase client only once outside component
let supabaseClient: ReturnType<typeof getSupabaseClient> | null = null;

// Initialize client safely
function getSafeSupabaseClient() {
  if (typeof window === 'undefined') {
    // Return null during server-side rendering to avoid hydration mismatch
    return null;
  }
  
  if (!supabaseClient) {
    try {
      supabaseClient = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
    }
  }
  return supabaseClient;
}

// Client-side only component to avoid hydration issues
function ClientLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseClient> | null>(null)

  // Initialize Supabase client safely - only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(getSafeSupabaseClient());
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        setError('Failed to initialize authentication. Please try again later.');
      }
    }
  }, []);

  // Handle Supabase auth state changes
  useEffect(() => {
    // Skip if Supabase client isn't initialized yet or if we're on the server
    if (!supabase || typeof window === 'undefined') return;
    
    // Flag to track if component is mounted
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process events if component is still mounted
        if (!isMounted) return;
        
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          // User has signed in with Google, handle the session
          if (session.user.app_metadata?.provider === 'google') {
            console.log('Google sign-in detected');
            try {
              await handleGoogleCallback(session.access_token || '');
            } catch (error) {
              console.error('Failed to handle Google callback:', error);
            }
          }
        }
      }
    );

    // Check for authentication tokens in URL
    const checkForToken = async () => {
      // Always skip on server-side rendering
      if (typeof window === 'undefined') {
        return;
      }
      
      try {
        // Check if this is a token redirect from localhost to production
        const urlParams = new URLSearchParams(window.location.search);
        const hasTokenRedirect = urlParams.get('token_redirect') === 'true';
        const hasCodeRedirect = urlParams.get('code_redirect') === 'true';
        const redirectSource = urlParams.get('source');
        
        console.log('Checking for authentication tokens');
        console.log('Current URL:', window.location.href);
        console.log('Has token redirect:', hasTokenRedirect);
        console.log('Has code redirect:', hasCodeRedirect);
        console.log('Redirect source:', redirectSource);
        
        // Handle error parameters
        if (urlParams.has('error')) {
          const error = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          const errorMessage = urlParams.get('message');
          console.error('Auth error:', error, errorDescription, errorMessage);
          setError(`Authentication error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}${errorMessage ? ` (${errorMessage})` : ''}`);
          setGoogleLoading(false);
          return;
        }
        
        // Handle authorization code redirect
        if (hasCodeRedirect) {
          console.log('Detected authorization code redirect');
          const savedCode = sessionStorage.getItem('eden_auth_code');
          
          if (savedCode) {
            console.log('Found saved authorization code');
            sessionStorage.removeItem('eden_auth_code'); // Clear it after use
            await handleGoogleCallback(savedCode);
            return;
          }
        }
        
        // Handle token redirect (from localhost to production)
        if (hasTokenRedirect) {
          console.log('Detected token redirect');
          const savedToken = sessionStorage.getItem('eden_auth_token');
          
          if (savedToken) {
            console.log('Found saved token');
            sessionStorage.removeItem('eden_auth_token'); // Clear it after use
            await handleGoogleCallback(savedToken);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking for tokens:', error);
      }
    };
    
    checkForToken();

    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log('Login page unmounting, cleanup initiated');
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]); // Only depend on supabase to prevent unnecessary re-renders

  // Handle Google auth callback
  const handleGoogleCallback = useCallback(async (accessToken: string) => {
    console.log('Processing Google callback with access token');
    setIsLoading(true);
    setError('');
    
    try {
      if (!accessToken) {
        throw new Error('No access token provided');
      }
      
      // Call our API to verify and create/update the admin user
      const response = await fetch('/api/admin/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });
      
      if (!response) {
        throw new Error('Failed to connect to authentication service');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to authenticate with Google');
      }
      
      console.log('Google authentication successful:', data);
      
      // Redirect to admin dashboard
      router.push('/admin');
    } catch (error: any) {
      console.error('Google callback error:', error);
      setError(error.message || 'Failed to complete Google authentication');
      setIsLoading(false);
    }
  }, [router]);

  // Handle Google sign-in
  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const client = supabase;
      
      if (!client) {
        throw new Error('Authentication client not initialized');
      }
      
      // Determine the redirect URL based on environment
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const redirectTo = isLocalhost 
        ? `${window.location.origin}/admin/login?token_redirect=true&source=localhost`
        : `${window.location.origin}/admin/login`;
      
      console.log('Starting Google sign-in with redirect to:', redirectTo);
      
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Google sign-in initiated:', data);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to start Google login');
      setGoogleLoading(false);
    }
  }, [supabase]);

  // Handle traditional email/password login
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Call our API to check admin credentials
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      console.log('Admin login successful');
      router.push('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [adminEmail, password, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8" suppressHydrationWarning>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Eden Clinic Logo" 
              width={150} 
              height={50} 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback if logo fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to access the admin dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="admin@edenclinicformen.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in with Email'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {googleLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Only @edenclinicformen.com or @edenclinic.co.uk email addresses are allowed</p>
        </div>
      </div>
    </div>
  );
}

// Client-side only wrapper to prevent hydration errors
export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only render the login component on the client side
  // This prevents hydration errors by ensuring no server/client mismatch
  return isMounted ? <ClientLoginPage /> : null;
}
