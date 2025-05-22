'use client'

import { useState, useEffect } from 'react'
import { Order, OrderStatus, ShippingAddress } from '@/types'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'



interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [internalNotes, setInternalNotes] = useState(order?.internalNotes || '')
  const initialStatus = order?.status || OrderStatus.PENDING
  const [status, setStatus] = useState<OrderStatus>(initialStatus as OrderStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [parsedAddress, setParsedAddress] = useState<ShippingAddress | null>(null)

  useEffect(() => {
    if (order?.shippingAddress) {
      try {
        let address: ShippingAddress;
        if (typeof order.shippingAddress === 'string') {
          address = JSON.parse(order.shippingAddress) as ShippingAddress;
        } else {
          address = order.shippingAddress as unknown as ShippingAddress;
        }
        console.log('Parsed shipping address:', address);
        setParsedAddress(address);
      } catch (error) {
        console.error('Error parsing shipping address:', error);
        setParsedAddress(null);
      }
    } else {
      setParsedAddress(null);
    }
  }, [order?.shippingAddress])

  if (!order) return null

  const handleUpdateOrder = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          internalNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      // Optionally trigger email if status changed to DISPATCHED
      if (status === OrderStatus.DISPATCHED && order.status !== OrderStatus.DISPATCHED) {
        await fetch(`/api/admin/orders/${order.id}/dispatch-notification`, {
          method: 'POST',
        })
      }

      onClose()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    } finally {
      setIsLoading(false)
    }
  }

  const formatShippingAddress = (address?: ShippingAddress | null) => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        {order.shippingAddress ? (
          <div className="space-y-1">
            {(() => {
              try {
                const address = JSON.parse(order.shippingAddress);
                return (
                  <>
                    <div>{address.line1}</div>
                    {address.line2 && <div>{address.line2}</div>}
                    <div>
                      {address.city}{address.state ? `, ${address.state}` : ''} {address.postal_code}
                    </div>
                    <div>{address.country}</div>
                  </>
                );
              } catch (e) {
                console.error('Failed to parse shipping address:', e);
                return <div className="text-red-500">Invalid address format</div>;
              }
            })()}
          </div>
        ) : (
          <div className="text-gray-500">No shipping address provided</div>
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
              {formatShippingAddress(parsedAddress)}
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
