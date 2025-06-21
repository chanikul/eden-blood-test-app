'use client'

import { useState, useEffect } from 'react'
import { Order, OrderStatus } from '../../types'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { TestResultUploader } from './TestResultUploader'
import { prisma } from '../../lib/prisma'
import { toast } from 'sonner'



interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [internalNotes, setInternalNotes] = useState(order?.internalNotes || '')
  const initialStatus = order?.status || OrderStatus.PENDING
  const [status, setStatus] = useState<OrderStatus>(initialStatus as OrderStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [testResultId, setTestResultId] = useState<string | null>(null)
  const router = useRouter()
  
  // Fetch test result for this order when the modal opens
  useEffect(() => {
    const fetchTestResult = async () => {
      if (!order) return;
      
      try {
        const response = await fetch(`/api/admin/orders/${order.id}/test-result`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            setTestResultId(data.result.id);
          }
        }
      } catch (error) {
        console.error('Error fetching test result:', error);
      }
    };
    
    fetchTestResult();
  }, [order?.id]);
  
  // Render null early, but after all hooks are defined
  if (!order) {
    return null
  }

  const handleUpdateOrder = async () => {
    if (!order) {
      toast.error('No order to update');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Button clicked - Updating order:', order.id);
      console.log('Current state values:', { status, internalNotes });
      
      // First, update the status using the dedicated status update endpoint
      console.log(`Sending status update request to /api/admin/orders/${order.id}/update-status`);
      const statusResponse = await fetch(`/api/admin/orders/${order.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Mode': 'true', // Add development mode header for local testing
        },
        body: JSON.stringify({
          status,
        }),
      });

      console.log('Status update response received - Status:', statusResponse.status);
      
      // Get response as text first to debug
      const statusResponseText = await statusResponse.text();
      console.log('Status update raw response text:', statusResponseText);
      
      // Try to parse the response as JSON if possible
      let statusResponseData;
      try {
        statusResponseData = JSON.parse(statusResponseText);
        console.log('Status update parsed response data:', statusResponseData);
      } catch (parseError) {
        console.error('Could not parse status update response as JSON:', parseError);
      }
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to update order status: ${statusResponse.status} ${statusResponseText}`);
      }
      
      // Now update internal notes if needed
      if (internalNotes !== order.internalNotes) {
        console.log('Updating internal notes');
        try {
          const notesResponse = await fetch('/api/update-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: order.id,
              internalNotes,
            }),
          });
          
          console.log('Notes update response status:', notesResponse.status);
          if (!notesResponse.ok) {
            console.warn('Failed to update internal notes, but status was updated successfully');
          }
        } catch (notesError) {
          console.warn('Error updating internal notes, but status was updated successfully:', notesError);
        }
      }
      
      console.log('Update successful - showing toast and refreshing');
      toast.success('Order updated successfully');
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false)
    }
  }

  const renderShippingAddress = () => {
    if (!order) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        {order.shippingAddress ? (
          <div className="space-y-3">
            {/* Formatted Address */}
            <div className="space-y-1 text-gray-800">
              {(() => {
                try {
                  type ShippingAddress = {
                    line1: string;
                    line2?: string | null;
                    city: string;
                    state?: string | null;
                    postal_code?: string;
                    postalCode?: string;
                    country: string;
                  };

                  let shippingAddress: ShippingAddress | null = null;
                  if (typeof order.shippingAddress === 'string') {
                    shippingAddress = JSON.parse(order.shippingAddress);
                  } else if (typeof order.shippingAddress === 'object' && order.shippingAddress !== null) {
                    shippingAddress = order.shippingAddress as ShippingAddress;
                  }

                  if (!shippingAddress) {
                    return <div>No shipping address provided</div>;
                  }

                  return (
                    <>
                      <div className="font-medium">{shippingAddress.line1}</div>
                      {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
                      <div>
                        {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')}
                      </div>
                      <div>{shippingAddress.postal_code || shippingAddress.postalCode}</div>
                      <div className="font-medium">{shippingAddress.country}</div>
                    </>
                  );
                } catch (e) {
                  console.error('Failed to parse shipping address:', e, '\nRaw value:', order.shippingAddress);
                  return <div className="text-red-500">Error: Invalid address format</div>;
                }
              })()}
            </div>
            
            {/* Debug: Raw JSON */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs font-mono text-gray-500 break-all">
                Raw data: {typeof order.shippingAddress === 'string' ? order.shippingAddress : JSON.stringify(order.shippingAddress)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">No shipping address recorded</div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Patient Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {order.patientName}</p>
              <p><span className="font-medium">Date of Birth:</span> {format(new Date(order.patientDateOfBirth), 'dd/MM/yyyy')}</p>
              <p><span className="font-medium">Email:</span> {order.patientEmail}</p>
              {order.patientMobile && (
                <p><span className="font-medium">Mobile:</span> {order.patientMobile}</p>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Order Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Order ID:</span> {order.id}</p>
              <p><span className="font-medium">Test Type:</span> {order.testName}</p>
              <p><span className="font-medium">Patient Name:</span> {order.patientName}</p>
              <p><span className="font-medium">Date of Birth:</span> {format(new Date(order.patientDateOfBirth), 'dd/MM/yyyy')}</p>
              <p><span className="font-medium">Email:</span> {order.patientEmail}</p>
              <p><span className="font-medium">Order Date:</span> {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              {renderShippingAddress()}
              <p>
                <span className="font-medium text-gray-800">Stripe Session ID:</span>{' '}
                {order.stripeSessionId || 'N/A'}
              </p>
              {order.dispatchedAt && (
                <p>
                  <span className="font-medium text-gray-800">Dispatched:</span>{' '}
                  {format(new Date(order.dispatchedAt), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>

          {/* Test Results Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Test Results</h3>
            <div className="mb-6">
              <TestResultUploader
                orderId={order.id}
                bloodTestId={order.bloodTestId || ''}
                clientId={order.clientId || ''}
                testName={order.testName}
                existingResultId={testResultId || undefined}
                onSuccess={() => {
                  toast.success('Test result updated successfully');
                  router.refresh();
                }}
              />
            </div>
          </div>

          {/* Order Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value
                    if (Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
                      setStatus(newStatus as OrderStatus)
                    }
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  disabled={isLoading}
                >
                  {Object.values(OrderStatus).map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={isLoading}
                  placeholder="Add any internal notes here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateOrder}
                  className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
