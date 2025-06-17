'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TestTube2,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { TestResultDownload } from '../../../components/client/TestResultDownload';
import { TestResultMcpProvider } from '../../../components/client/TestResultMcpProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';

// Define TestStatus enum locally to match the Prisma schema
enum TestStatus {
  processing = 'processing',
  ready = 'ready'
}

interface TestResult {
  id: string;
  status: TestStatus;
  resultUrl?: string | null;
  orderId: string;
  bloodTestId: string;
  createdAt: Date;
  updatedAt: Date;
  bloodTest?: {
    name: string;
    slug: string;
  };
  order?: {
    createdAt: Date;
    testName: string;
  };
}

export default function BloodTestsPage() {
  // We'll use client-side authentication instead of server-side
  const [userId, setUserId] = useState<string | null>(null);

  const [results, setResults] = useState<TestResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserAndResults() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current user
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          throw new Error('Failed to authenticate');
        }
        
        const userData = await userResponse.json();
        if (!userData.user?.id) {
          window.location.href = '/login';
          return;
        }
        
        setUserId(userData.user.id);
        
        // Fetch test results
        const resultsResponse = await fetch('/api/test-results', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!resultsResponse.ok) {
          throw new Error('Failed to fetch test results');
        }
        
        const data = await resultsResponse.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your test results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserAndResults();
  }, []);

  const filteredResults = results.filter(result => {
    const testName = result.bloodTest?.name || result.order?.testName || '';
    const matchesSearch = testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Don't render the MCP provider until we have the user ID
  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
            <Loader2 className="h-8 w-8 text-teal-500 mx-auto animate-spin mb-4" />
            <p className="text-gray-500">Loading your profile...</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-red-200 p-8 text-center">
            <p className="text-red-500 mb-2">Unable to load your profile. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <TestResultMcpProvider patientId={userId} serviceType="blood-test">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Results</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and download your blood test results
            </p>
          </div>
        </div>

      {/* Filters */}
      <div className="mb-6 md:flex md:items-center md:space-x-4">
        <div className="relative flex-1 mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          />
        </div>
        <div className="relative inline-block">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TestStatus | 'ALL')}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All statuses</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <Loader2 className="h-8 w-8 text-teal-500 mx-auto animate-spin mb-4" />
          <p className="text-gray-500">Loading your test results...</p>
        </div>
      )}
      
      {/* Error state - only show for actual errors, not empty results */}
      {error && !isLoading && error !== 'Failed to load your test results. Please try again later.' && (
        <div className="bg-white shadow-sm rounded-lg border border-red-200 p-8 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Tests List */}
      {!isLoading && !error && filteredResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResults.map((result) => (
            <TestResultDownload key={result.id} result={result} />
          ))}
        </div>
      )}
      
      {!isLoading && (!error || error === 'Failed to load your test results. Please try again later.') && filteredResults.length === 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <TestTube2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your results are being prepared</h3>
          
          {searchQuery || statusFilter !== 'ALL' ? (
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
          ) : (
            <>
              <p className="text-gray-500 mb-2">Your test results are being processed by our lab team</p>
              <p className="text-sm text-gray-400 mb-4">
                You'll receive an email notification when your results are ready to view
              </p>
              <p className="text-sm text-gray-400 mb-2">
                If you have any questions, please contact our support team
              </p>
            </>
          )}
        </div>
      )}
    </div>
    </TestResultMcpProvider>
  );
}
