'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Loader2, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TestResultUploader } from '@/components/admin/TestResultUploader';

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
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  bloodTest?: {
    name: string;
    slug: string;
  };
  order?: {
    createdAt: Date;
    testName: string;
    patientName: string;
    patientEmail: string;
  };
}

export default function AdminTestResultsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    async function fetchTestResults() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/test-results', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch test results');
        }
        
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError('Failed to load test results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTestResults();
  }, []);

  const filteredResults = results.filter(result => {
    const testName = result.bloodTest?.name || result.order?.testName || '';
    const patientName = result.order?.patientName || '';
    const patientEmail = result.order?.patientEmail || '';
    
    const searchTerms = [testName, patientName, patientEmail, result.orderId];
    const matchesSearch = searchQuery === '' || 
      searchTerms.some(term => 
        term.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'ALL' || result.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleResultUpdated = () => {
    // Refresh the results list
    setSelectedResult(null);
    window.location.reload();
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case TestStatus.processing:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      case TestStatus.ready:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Test Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and update blood test results
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/admin/test-results/cleanup"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clean Up Test Data
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 md:flex md:items-center md:space-x-4">
        <div className="relative flex-1 mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by test name, patient, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2"
          />
        </div>
        <div className="relative inline-block w-full md:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TestStatus | 'ALL')}
            className="block w-full"
          >
            <option value="ALL">All statuses</option>
            <option value={TestStatus.processing}>Processing</option>
            <option value={TestStatus.ready}>Ready</option>
          </Select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <Loader2 className="h-8 w-8 text-indigo-500 mx-auto animate-spin mb-4" />
          <p className="text-gray-500">Loading test results...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-white shadow-sm rounded-lg border border-red-200 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Selected Result for Editing */}
      {selectedResult && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Update Test Result</h2>
            <button
              onClick={() => setSelectedResult(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <TestResultUploader
            orderId={selectedResult.orderId}
            bloodTestId={selectedResult.bloodTestId}
            clientId={selectedResult.clientId}
            testName={selectedResult.bloodTest?.name || selectedResult.order?.testName || 'Unknown Test'}
            existingResultId={selectedResult.id}
            onSuccess={handleResultUpdated}
          />
        </div>
      )}
      
      {/* Results Table */}
      {!isLoading && !error && filteredResults.length > 0 && !selectedResult && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {result.bloodTest?.name || result.order?.testName || 'Unknown Test'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Order: {result.orderId.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.order?.patientName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{result.order?.patientEmail || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(result.updatedAt), 'dd MMM yyyy')}
                    <div className="text-xs">
                      {format(new Date(result.updatedAt), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    {result.resultUrl && (
                      <a
                        href={result.resultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <FileText className="h-4 w-4 inline" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && !error && filteredResults.length === 0 && !selectedResult && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          
          {searchQuery || statusFilter !== 'ALL' ? (
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
          ) : (
            <p className="text-gray-500 mb-4">
              There are no test results in the system yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
