'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TestTube2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Filter
} from 'lucide-react';

interface BloodTest {
  id: string;
  testName: string;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  date: Date;
  resultUrl?: string;
}

export default function BloodTestsPage() {
  const [tests, setTests] = useState<BloodTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BloodTest['status'] | 'ALL'>('ALL');

  useEffect(() => {
    // TODO: Fetch blood tests from API
    setTests([
      {
        id: '1',
        orderId: 'ORD-12345',
        testName: 'Complete Blood Count',
        status: 'COMPLETED',
        date: new Date('2025-05-20'),
        resultUrl: '/results/cbc-123.pdf',
      },
      {
        id: '2',
        orderId: 'ORD-12346',
        testName: 'Vitamin D Test',
        status: 'PENDING',
        date: new Date('2025-05-22'),
      },
      {
        id: '3',
        orderId: 'ORD-12347',
        testName: 'Thyroid Function',
        status: 'CANCELLED',
        date: new Date('2025-05-15'),
      },
    ]);
  }, []);

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BloodTest['status']) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-amber-100 text-amber-800',
      PAID: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const icons = {
      COMPLETED: <CheckCircle2 className="h-4 w-4" />,
      PENDING: <Clock className="h-4 w-4" />,
      PAID: <Clock className="h-4 w-4" />,
      CANCELLED: <XCircle className="h-4 w-4" />,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <span className="mr-1">{icons[status]}</span>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Results</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and download your blood test results
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/client/blood-tests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Blood Test
          </Link>
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
            onChange={(e) => setStatusFilter(e.target.value as BloodTest['status'] | 'ALL')}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tests List */}
      {filteredTests.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredTests.map((test) => (
              <li key={test.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <TestTube2 className="h-8 w-8 text-gray-400" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {test.testName}
                      </p>
                      <div className="flex text-sm text-gray-500 space-x-2">
                        <p>Order ID: {test.orderId}</p>
                        <span>•</span>
                        <p>{test.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-4">
                    {getStatusBadge(test.status)}
                    {test.resultUrl && test.status === 'COMPLETED' && (
                      <a
                        href={test.resultUrl}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Result
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <TestTube2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          
          {searchQuery || statusFilter !== 'ALL' ? (
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria
            </p>
          ) : (
            <>
              <p className="text-gray-500 mb-2">You don't have any blood test results yet</p>
              <p className="text-sm text-gray-400 mb-6">
                Order your first blood test to get started with your health journey
              </p>
            </>
          )}
          
          <Link
            href="/client/blood-tests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Order a Blood Test
          </Link>
        </div>
      )}
    </div>
  );
}
