'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TestTube2, 
  Calendar, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Bell,
  LifeBuoy,
  Download
} from 'lucide-react';
import { ReminderPreferences, BloodTestWithFollowUp } from '@/lib/types/reminders';
import { BloodTest } from '@/lib/types/blood-test';



interface DashboardData {
  firstName: string;
  recentTests: {
    id: string;
    testName: string;
    status: 'PENDING' | 'PAID' | 'DISPATCHED' | 'CANCELLED' | 'READY';
    date: string;
    pdf_url?: string | null;
    testResult?: {
      id: string;
      status: 'processing' | 'ready';
      resultUrl?: string | null;
    } | null;
  }[];
  hasActivePaymentMethod: boolean;
}

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const currentHour = new Date().getHours();

  const greeting = currentHour < 12 
    ? 'Good morning' 
    : currentHour < 18 
      ? 'Good afternoon' 
      : 'Good evening';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/client');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  const isUpcomingSoon = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours < 24;
  };

  const getStatusIcon = (status: DashboardData['recentTests'][0]['status']) => {
    switch (status) {
      case 'DISPATCHED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'READY':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {greeting}, {data.firstName}!
        </h1>
        <p className="mt-1 text-gray-500">
          Welcome to your health dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href="/client/blood-tests/new"
              className="flex items-center justify-between p-4 bg-teal-100 rounded-md text-teal-700 hover:bg-teal-200 transition-colors font-medium"
            >
              <div className="flex items-center">
                <TestTube2 className="h-6 w-6 mr-3" />
                <span>Order a new blood test</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/support"
              className="flex items-center justify-between p-3 bg-indigo-50 rounded-md text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center">
                <LifeBuoy className="h-5 w-5 mr-3" />
                <span>Get Support</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            {/* Commented out for MVP - can be re-enabled via feature flags in the future */}
            {/* <Link 
              href="/client/bookings/new"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3" />
                <span>Schedule an appointment</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link> */}
            {/* <Link 
              href="/client/prescriptions"
              className="flex items-center justify-between p-3 bg-purple-50 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" />
                <span>Request a prescription</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link> */}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Results</h2>
          <div className="space-y-3">
            {data.recentTests && data.recentTests.length > 0 ? (
              <>
                {data.recentTests.map((test) => (
                  <div key={test.id} className="flex flex-col">
                    <Link
                      href={`/client/blood-tests/${test.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        {getStatusIcon(test.status)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{test.testName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(test.date).toLocaleDateString()}
                          </p>
                          {test.status === 'READY' && (
                            <p className="text-xs text-blue-600 font-medium mt-1">Results ready</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </Link>
                    {test.status === 'READY' && test.testResult && test.testResult.status === 'ready' && test.testResult.resultUrl && (
                      <a 
                        href={`/api/test-results/${test.testResult.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 ml-8 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Result
                      </a>
                    )}
                  </div>
                ))}
                <Link
                  href="/client/blood-tests"
                  className="mt-4 inline-flex items-center text-sm text-teal-600 hover:text-teal-800"
                >
                  View all results
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="text-center py-6">
                <TestTube2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No test results yet</p>
                <p className="text-sm text-gray-400 mb-4">Your test results will appear here once available</p>
                <Link
                  href="/client/blood-tests/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Order your first test
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Preview - Commented out for MVP */}
        {/* {data.hasActivePaymentMethod && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <div>
                  <h2 className="text-sm font-medium text-gray-900">Default Payment Method</h2>
                  <p className="text-sm text-gray-500">•••• •••• •••• 4242</p>
                </div>
              </div>
              <Link 
                href="/client/payment-methods"
                className="text-sm text-teal-600 hover:text-teal-800 flex items-center"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        )} */}


      </div>
    </div>
  );
}
