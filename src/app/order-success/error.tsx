'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Order success page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Verification Failed</h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Unable to verify your payment. Please contact support if this persists.'}
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={reset}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="text-blue-500 hover:text-blue-600 text-center"
          >
            Return to home
          </a>
        </div>
      </div>
    </div>
  );
}
