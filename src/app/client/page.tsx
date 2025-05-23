'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TestTube2, 
  Calendar, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface BloodTest {
  id: string;
  testName: string;
  status: 'PENDING' | 'PAID' | 'COMPLETED';
  date: Date;
}

interface DashboardData {
  firstName: string;
  recentTests: BloodTest[];
  upcomingBooking?: {
    id: string;
    date: Date;
    type: string;
  };
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
    // TODO: Fetch dashboard data
    setData({
      firstName: 'Chanikul',
      recentTests: [
        {
          id: '1',
          testName: 'Complete Blood Count',
          status: 'COMPLETED',
          date: new Date('2025-05-20'),
        },
        {
          id: '2',
          testName: 'Vitamin D Test',
          status: 'PENDING',
          date: new Date('2025-05-22'),
        },
      ],
      upcomingBooking: {
        id: '1',
        date: new Date('2025-05-25'),
        type: 'Blood Sample Collection',
      },
    });
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  const getStatusIcon = (status: BloodTest['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-500" />;
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
              className="flex items-center justify-between p-3 bg-teal-50 rounded-md text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <div className="flex items-center">
                <TestTube2 className="h-5 w-5 mr-3" />
                <span>Order a new blood test</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/client/bookings/new"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-md text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3" />
                <span>Schedule an appointment</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/client/prescriptions"
              className="flex items-center justify-between p-3 bg-purple-50 rounded-md text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" />
                <span>Request a prescription</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Tests</h2>
          <div className="space-y-3">
            {data.recentTests.map((test) => (
              <Link
                key={test.id}
                href={`/client/blood-tests/${test.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  {getStatusIcon(test.status)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{test.testName}</p>
                    <p className="text-sm text-gray-500">
                      {test.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
          <Link
            href="/client/blood-tests"
            className="mt-4 inline-flex items-center text-sm text-teal-600 hover:text-teal-800"
          >
            View all tests
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Upcoming Booking */}
        {data.upcomingBooking && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Booking</h2>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    {data.upcomingBooking.type}
                  </p>
                  <p className="text-sm text-blue-700">
                    {data.upcomingBooking.date.toLocaleDateString()} at{' '}
                    {data.upcomingBooking.date.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex space-x-3">
                <button className="text-sm text-blue-700 hover:text-blue-900">
                  Reschedule
                </button>
                <button className="text-sm text-red-600 hover:text-red-800">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
