'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findClientUserByEmail } from '@/lib/services/client-user';
import { Loader2 } from 'lucide-react';

type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'DISPATCHED';

interface Order {
  id: string;
  patientName: string;
  patientEmail: string;
  testName: string;
  status: OrderStatus;
  createdAt: Date;
  patientDateOfBirth: string;
  client: { id: string } | null;
}

interface OrderDetails {
  patientName: string;
  patientEmail: string;
  testName: string;
  status: OrderStatus;
  id: string;
  createdAt: Date;
  patientDateOfBirth: string;
  client: { id: string } | null;
}

interface OrderSuccessPageProps {
  params: {
    orderId: string;
  };
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderId } = params;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPaymentAndFetchOrder() {
      try {
        // Fetch order with client information
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            patientName: true,
            patientEmail: true,
            testName: true,
            status: true,
            createdAt: true,
            patientDateOfBirth: true,
            client: {
              select: {
                id: true
              }
            }
          }
        }) as Order | null;

        if (!order) {
          return redirect('/404');
        }

        // If order is not in a success state, redirect to error page
        if (order.status === 'PENDING') {
          return redirect('/500?error=payment_pending');
        } else if (order.status === 'CANCELLED') {
          return redirect('/500?error=payment_cancelled');
        }

        // If the user has an account, redirect to the client dashboard
        if (order.client) {
          return redirect(`/client/account/orders/${order.id}`);
        }

        // Check if user exists but isn't linked to this order
        const existingUser = await findClientUserByEmail(order.patientEmail);
        const showAccountCreation = !existingUser;

        setOrderDetails({
          patientName: order.patientName,
          patientEmail: order.patientEmail,
          testName: order.testName,
          status: order.status,
          id: order.id,
          createdAt: order.createdAt,
          patientDateOfBirth: order.patientDateOfBirth,
          client: order.client,
        });
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
      }
    }

    verifyPaymentAndFetchOrder();
  }, [orderId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600">{error}</p>
          <div className="mt-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-8">
      <div className="text-center">
        <div className="text-green-600 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4">Order Confirmed!</h2>
        <p className="mb-2">Thank you for your order, {orderDetails.patientName}.</p>
        <p className="text-gray-600 mb-4">
          Order ID: <span className="font-mono">{orderDetails.id}</span>
        </p>

        <div className="text-left bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Order Details:</h3>
          <p>Test: {orderDetails.testName}</p>
          <p>Date: {new Date(orderDetails.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {!orderDetails.client && (
        <div className="border-t pt-8">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Create an Account</h3>
            <p className="text-blue-700">
              Create an account to track your order status and access your test results when they're ready.
            </p>
          </div>
          
          <form action="/api/client/register" method="POST" className="space-y-4">
            <input type="hidden" name="email" value={orderDetails.patientEmail} />
            <input type="hidden" name="name" value={orderDetails.patientName} />
            <input type="hidden" name="dateOfBirth" value={orderDetails.patientDateOfBirth} />
            <input type="hidden" name="orderId" value={orderDetails.id} />
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Choose a Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                className="block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="At least 8 characters"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
