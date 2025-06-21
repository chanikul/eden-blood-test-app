'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// AdminLayout is provided by the parent route
import { Button } from '@/components/ui';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, FileText, Calendar, Edit, Plus, Trash } from 'lucide-react';
import Link from 'next/link';
import { TestResultViewerModal } from '../../../../components/admin/TestResultViewerModal';

interface ClientUser {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  mobile?: string;
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  orders?: Order[];
}

interface Order {
  id: string;
  createdAt: Date;
  status: string;
  testResults?: TestResult[];
  bloodTest: {
    id: string;
    name: string;
  };
}

interface TestResult {
  id: string;
  status: string;
  resultUrl?: string;
  createdAt: Date;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingTestResult, setViewingTestResult] = useState<string | null>(null);
  const [viewingTestName, setViewingTestName] = useState<string>('');

  useEffect(() => {
    fetchClientDetails();
  }, [params.id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching client details for ID:', params.id);
      
      // Use the trailing slash format which matches our API route
      const response = await fetch(`/api/admin/clients/${params.id}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store' // Disable caching
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        if (response.status === 404) {
          setError('Client not found');
        } else {
          setError(`Failed to load client details (${response.status})`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('Client data received:', data);
      
      // Successfully loaded client data
      setClient(data);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError('An error occurred while fetching client details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 text-teal-500 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Loading client details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Client not found</p>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push('/admin/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="secondary" onClick={() => router.push('/admin/clients')} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => toast.info('Edit functionality coming soon')}>
              <Edit className="mr-2 h-4 w-4" /> Edit Client
            </Button>
            <Button variant="primary" onClick={() => router.push(`/admin/clients/${params.id}/add-test`)}>
              <Plus className="mr-2 h-4 w-4" /> Add Blood Test
            </Button>
          </div>
        </div>

        {/* Client Summary Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Client Summary</h3>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1 text-sm text-gray-900">{client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900">{client.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(client.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p className="mt-1 text-sm text-gray-900">{client.mobile || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Login</p>
                <p className="mt-1 text-sm text-gray-900">
                  {client.lastLoginAt ? formatDate(client.lastLoginAt) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Test Orders */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Blood Test Orders</h3>
          </div>
          <div className="px-6 py-5">
            {client.orders && client.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {client.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.bloodTest.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.testResults && order.testResults.length > 0 ? (
                            order.testResults[0].resultUrl ? (
                              <button
                                onClick={() => {
                                  setViewingTestResult(order.testResults && order.testResults[0]?.id || null);
                                  setViewingTestName(order.bloodTest.name);
                                }}
                                className="text-teal-600 hover:text-teal-800 flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-1" /> View Result
                              </button>
                            ) : (
                              <span className="text-yellow-500">Pending Upload</span>
                            )
                          ) : (
                            <span className="text-gray-400">No Result</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No blood test orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This client doesn't have any blood test orders yet.
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/admin/clients/${params.id}/add-test`)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Blood Test
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Files */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Uploaded Files</h3>
          </div>
          <div className="px-6 py-5">
            {client.orders && client.orders.some(order => order.testResults && order.testResults.length > 0 && order.testResults[0]?.resultUrl) ? (
              <div className="space-y-4">
                {client.orders
                  .filter(order => order.testResults && order.testResults.length > 0 && order.testResults[0]?.resultUrl)
                  .map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-teal-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.bloodTest.name} Result</p>
                          <p className="text-xs text-gray-500">Uploaded on {formatDate(order.testResults && order.testResults[0]?.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setViewingTestResult(order.testResults && order.testResults[0]?.id || null);
                            setViewingTestName(order.bloodTest.name);
                          }}
                          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No test result files have been uploaded for this client yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Result Viewer Modal */}
        <TestResultViewerModal
          isOpen={!!viewingTestResult}
          onClose={() => setViewingTestResult(null)}
          testResultId={viewingTestResult}
          testName={viewingTestName}
        />
      </div>
  );
}
