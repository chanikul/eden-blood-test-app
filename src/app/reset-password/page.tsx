import Link from 'next/link';
import { Metadata } from 'next';
import ResetPasswordForm from './reset-password-form';

// Define metadata for better SEO
export const metadata: Metadata = {
  title: 'Reset Password | Eden Clinic',
  description: 'Reset your password for your Eden Clinic account',
};

// This is a server component that handles the initial rendering
export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  // Get token from searchParams (server-side)
  const token = searchParams?.token || '';
  
  // If no token is provided, show an error message
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invalid Reset Link</h1>
            <p className="text-gray-600 mt-2">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // If token exists, render the client component with the token
  return <ResetPasswordForm token={token} />;
}
