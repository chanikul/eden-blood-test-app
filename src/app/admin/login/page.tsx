'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OtpStep from './OtpStep'
import Image from 'next/image'
import { getSupabaseClient } from '../../../lib/supabase-client'

// Get the singleton instance of Supabase client
const supabase = getSupabaseClient()

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'login' | 'otp'>('login')
  const [adminEmail, setAdminEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  // Handle Supabase auth state changes
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN' && session) {
          // User has signed in with Google, handle the session
          if (session.user?.app_metadata?.provider === 'google') {
            console.log('Google sign-in detected');
            await handleGoogleCallback(session.access_token);
          }
        }
      }
    );

    // Check for access token in URL hash or session storage (for redirect flow)
    const checkForToken = async () => {
      // Check if this is a token redirect from localhost to production
      const urlParams = new URLSearchParams(window.location.search);
      const isTokenRedirect = urlParams.get('token_redirect') === 'true';
      
      if (isTokenRedirect) {
        console.log('Detected token redirect parameter');
        const savedToken = sessionStorage.getItem('eden_auth_token');
        if (savedToken) {
          console.log('Found saved token from redirect');
          sessionStorage.removeItem('eden_auth_token'); // Clear it after use
          await handleGoogleCallback(savedToken);
          return;
        }
      }
      
      // First check if we're on localhost but should be on production
      if (window.location.hostname === 'localhost' && localStorage.getItem('eden_auth_origin')) {
        const productionOrigin = localStorage.getItem('eden_auth_origin');
        if (productionOrigin && !productionOrigin.includes('localhost')) {
          console.log('Detected localhost redirect in production, redirecting to production URL');
          // Save any token we might have in the hash
          if (window.location.hash && window.location.hash.includes('access_token=')) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            if (accessToken) {
              sessionStorage.setItem('eden_auth_token', accessToken);
            }
          }
          // Redirect to production with token_redirect parameter
          window.location.href = `${productionOrigin}/admin/login?token_redirect=true`;
          return;
        }
      }
      
      // Check for token in hash (normal flow)
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        console.log('Found access token in URL hash');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          // We have a token from the redirect flow
          await handleGoogleCallback(accessToken);
        }
      }
    };
    
    // Check for tokens on initial load
    checkForToken();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      // In development mode, bypass Google auth and redirect directly to admin
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Bypassing Google auth');
        router.push('/admin');
        return;
      }
      
      // Store current hostname in localStorage to verify after redirect
      const currentOrigin = window.location.origin;
      localStorage.setItem('eden_auth_origin', currentOrigin);
      console.log('Storing origin for redirect verification:', currentOrigin);
      
      // Force the redirectTo to use the current origin, not localhost
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/admin/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  // Handle Google auth callback
  const handleGoogleCallback = async (token: string) => {
    try {
      console.log('Processing Google authentication with token:', token.substring(0, 10) + '...');
      setGoogleLoading(true);
      
      // In development mode, bypass domain validation
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Bypassing Google auth callback validation');
        router.push('/admin');
        return;
      }
      
      // Check if we're on localhost but should be on a production URL
      const storedOrigin = localStorage.getItem('eden_auth_origin');
      console.log('Stored origin:', storedOrigin, 'Current origin:', window.location.origin);
      
      if (storedOrigin && 
          window.location.hostname === 'localhost' && 
          !storedOrigin.includes('localhost')) {
        console.log('Detected localhost redirect when we should be on production');
        // Save the token before redirecting
        sessionStorage.setItem('eden_auth_token', token);
        window.location.href = `${storedOrigin}/admin/login?token_redirect=true`;
        return;
      }
      
      // Get user info from the session to check domain
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user data:', userError);
        throw new Error('Failed to get user information');
      }
      
      console.log('User data:', userData);
      
      // Check if user has a valid domain
      const email = userData.user?.email;
      if (!email || !email.endsWith('@edenclinic.co.uk') && !email.endsWith('@edenclinicformen.com')) {
        throw new Error('Only Eden Clinic staff can access the admin area');
      }
      
      // Send the token to our backend to validate domain and create/update admin user
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect to admin dashboard on success
      console.log('Authentication successful, redirecting to admin dashboard');
      router.push('/admin');
    } catch (err) {
      console.error('Google auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setGoogleLoading(false);
    }
  };

  // Handle traditional email/password login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      // Password correct, redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Eden Clinic Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in with your Eden Clinic account
          </p>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {googleLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-center text-gray-500">
            Only @edenclinicformen.com or @edenclinic.co.uk email addresses are allowed
          </p>
        </div>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with password</span>
          </div>
        </div>

        {step === 'login' ? (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <OtpStep email={adminEmail} onSuccess={() => { setStep('login'); }} />
        )}
      </div>
    </div>
  )
}
