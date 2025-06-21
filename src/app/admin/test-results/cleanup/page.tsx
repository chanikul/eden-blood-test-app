'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function CleanupTestDataPage() {
  const router = useRouter();

  // Cleanup functionality has been disabled for production

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/admin/test-results"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Test Results
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Clean Up Test Data</h1>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Feature Disabled</h3>
              <p className="text-sm text-red-700 mt-1">
                This feature has been disabled for production use. Please contact system administrators if you need assistance.
              </p>
            </div>
          </div>
        </div>
        
        <Link
          href="/admin/test-results"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Test Results
        </Link>
      </div>
    </div>
  );
}
