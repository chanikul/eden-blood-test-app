'use client';

import { AlertOctagon } from 'lucide-react';

export default function Error500Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Server Error</h1>
        <p className="text-gray-600 mb-6">
          Sorry, something went wrong on our end. Please try again later.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="block text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
