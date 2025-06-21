'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TestTube2,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { OrderTestResultViewer } from '../../../components/client/OrderTestResultViewer';
import { BloodTestResultsTable } from '../../../components/client/BloodTestResultsTable';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    async function fetchUserAndResults() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current user - use the patient token from getPatientFromToken
        const userResponse = await fetch('/api/client/profile-data');
        if (!userResponse.ok) {
          console.error('Authentication failed:', await userResponse.text());
          throw new Error('Failed to authenticate');
        }
        
        const userData = await userResponse.json();
        if (!userData?.id) {
          console.error('No user data found in response');
          window.location.href = '/login';
          return;
        }
        
        // Set the user ID from the profile data
        setUserId(userData.id);
        
        // Fetch test results - the API will use the patient token from cookies
        const resultsResponse = await fetch('/api/test-results', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          // Add cache busting to prevent stale data
          cache: 'no-store'
        });
        
        if (!resultsResponse.ok) {
          console.error('Failed to fetch test results:', await resultsResponse.text().catch(() => 'No response text'));
          throw new Error('Failed to fetch test results');
        }
        
        const data = await resultsResponse.json();
        console.log(`Loaded ${data.results?.length || 0} test results`);
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
        <div className="relative inline-block mr-2">
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
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 flex items-center ${viewMode === 'cards' ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            <span className="text-sm">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 flex items-center ${viewMode === 'table' ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="text-sm">Table</span>
          </button>
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
        <>
          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((result) => (
                <OrderTestResultViewer 
                  key={result.id}
                  order={{
                    id: result.orderId,
                    status: result.order?.testName?.includes('DISPATCHED') ? 'DISPATCHED' : result.status === 'ready' ? 'READY' : 'PENDING',
                    createdAt: result.order?.createdAt || result.createdAt,
                    updatedAt: result.updatedAt,
                    testName: result.order?.testName || result.bloodTest?.name || 'Blood Test'
                  }}
                  testResult={{
                    id: result.id,
                    status: result.status,
                    resultUrl: result.resultUrl || null,
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <BloodTestResultsTable 
                results={filteredResults.map(result => ({
                  id: result.id,
                  testName: result.order?.testName || result.bloodTest?.name || 'Blood Test',
                  orderDate: result.order?.createdAt || result.createdAt,
                  status: result.order?.testName?.includes('DISPATCHED') ? 'DISPATCHED' : result.status === 'ready' ? 'READY' : 'PENDING',
                  resultStatus: result.status,
                  resultId: result.status === 'ready' ? result.id : undefined
                }))}
              />
            </div>
          )}
        </>
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
