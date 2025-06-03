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
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    deletedTestResults: number;
    updatedTestStatuses: number;
    syncedWithStripe: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/cleanup-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean up test data');
      }
      
      const data = await response.json();
      setResults(data);
      toast.success('Test data cleaned up successfully');
    } catch (err) {
      console.error('Error cleaning up test data:', err);
      setError('Failed to clean up test data. Please try again later.');
      toast.error('Failed to clean up test data');
    } finally {
      setIsLoading(false);
    }
  };

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
        <p className="text-gray-600 mb-6">
          This utility will perform the following actions:
        </p>
        
        <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
          <li>Sync test results with Stripe products</li>
          <li>Delete invalid test results without associated orders or blood tests</li>
          <li>Update test statuses to match the new enum values (processing/ready)</li>
          <li>Clean up orphaned files in storage</li>
        </ul>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Caution</h3>
              <p className="text-sm text-amber-700 mt-1">
                This operation will modify your database. It's recommended to back up your data before proceeding.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Cleaning up...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clean Up Test Data
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleCleanup}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {results && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Synced with Stripe: {results.syncedWithStripe} products</li>
                  <li>Updated test statuses: {results.updatedTestStatuses} records</li>
                  <li>Deleted invalid test results: {results.deletedTestResults} records</li>
                </ul>
              </div>
              <div className="mt-4">
                <Link
                  href="/admin/test-results"
                  className="text-sm font-medium text-green-600 hover:text-green-500"
                >
                  Return to Test Results
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
