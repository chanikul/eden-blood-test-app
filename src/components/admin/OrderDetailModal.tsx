'use client'

import { useState } from 'react'
import { Order, OrderStatus } from '@/types'
import { format } from 'date-fns'

interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [internalNotes, setInternalNotes] = useState(order?.internalNotes || '')
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'PENDING')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Patient Information
              </h3>
              <div className="space-y-2 text-gray-800">
                <p>
                  <span className="font-medium text-gray-800">Name:</span> {order.patientName}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Email:</span> {order.patientEmail}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Date of Birth:</span>{' '}
                  {order.patientDateOfBirth}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Mobile:</span>{' '}
                  {order.patientMobile || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Order Information
              </h3>
              <div className="space-y-2 text-gray-800">
                <p>
                  <span className="font-medium text-gray-800">Test Type:</span> {order.testName}
                </p>
                <p>
                  <span className="font-medium text-gray-800">Order Date:</span>{' '}
                  {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
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
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Shipping Address
            </h3>
            {order.shippingAddress ? (
              <pre className="whitespace-pre-wrap bg-white border border-gray-200 p-3 rounded text-gray-800">
                {JSON.stringify(order.shippingAddress, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-800">No shipping address provided</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800 bg-white"
              disabled={isLoading}
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Internal Notes
            </h3>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-800 bg-white"
              placeholder="Add internal notes here..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateOrder}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
