'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/patient/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login response error:', { status: response.status, data });
        throw new Error(data.message || 'Login failed');
      }

      console.log('Login response:', data);

      // Show success toast and redirect
      if (data.passwordChangeRequired) {
        toast.info('Please change your password');
        router.push('/change-password');
      } else {
        toast.success('Login successful');
        window.location.href = '/client';
      }
    } catch (error: any) {
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setError(error.message || 'An error occurred during login');
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Eden Clinic</h1>
          <p className="text-gray-600 mt-2">Welcome to your Patient Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="your.email@example.com"
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link 
              href="/forgot-password" 
              className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">First time logging in?</h3>
            <p className="text-sm text-blue-700">
              If you selected "Create Account" during checkout, check your email for your temporary password.
              You'll be prompted to change your password on first login.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              If you checked out as a guest, you'll need to create an account to access your results.
              Please contact support for assistance.
            </p>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-center text-gray-600">
              Need help? Contact us at{' '}
              <a 
                href="mailto:support@edenclinic.co.uk" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                support@edenclinic.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
