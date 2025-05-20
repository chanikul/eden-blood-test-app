'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

interface OrderSuccessPageProps {
  params: {
    orderId: string;
  };
}

interface OrderDetails {
  patientName: string;
  patientEmail: string;
  testName: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

export default function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderId } = params;
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function verifyPaymentAndFetchOrder() {
      try {
        // Get the session ID from URL
        const searchParams = new URLSearchParams(window.location.search);
        const sessionId = searchParams.get('session_id');

        if (sessionId) {
          console.log('Verifying payment...', { orderId, sessionId });
          // First verify the payment
          const verifyResponse = await fetch(`/api/verify-payment?orderId=${orderId}&sessionId=${sessionId}`);
          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            throw new Error(errorData.error || 'Failed to verify payment');
          }
        }

        // Then fetch order details
        console.log('Fetching order details...');
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);

          // If order is still pending, redirect to error page
          if (data.status === 'PENDING') {
            router.push('/500?error=payment_pending');
          } else if (data.status === 'CANCELLED') {
            router.push('/500?error=payment_cancelled');
          }
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to load order details');
      }
    }

    verifyPaymentAndFetchOrder();
  }, [orderId, router]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-4">
          Thank you, {orderDetails.patientName}!
        </p>
        <p className="text-gray-600 mb-2">
          Your order ID: <span className="font-medium">{orderId}</span>
        </p>
        <div className="bg-blue-50 p-4 rounded-md mt-6">
          <p className="text-blue-800 text-sm">
            We've sent a confirmation email to {orderDetails.patientEmail}. Your {orderDetails.testName} test has been ordered.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
