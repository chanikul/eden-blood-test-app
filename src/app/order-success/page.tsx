'use client';

import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

interface OrderSuccessPageProps {
  searchParams: {
    sessionId?: string;
    orderId?: string;
  };
}

export default function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const sessionId = searchParams.sessionId;
  const orderId = searchParams.orderId;

  // Need both sessionId and orderId
  if (!sessionId || !orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Missing Session Information</h2>
          <p className="text-gray-500 mb-6">Unable to verify your payment. Please contact support if this persists.</p>
          <a href="/" className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log('Verifying payment:', { sessionId });
        const response = await fetch(
          `/api/verify-payment?sessionId=${sessionId}`,
          { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Verify payment response:', { status: response.status });
        const data = await response.json();

        if (!response.ok) {
          console.error('Payment verification failed:', data);
          setError(data.error || 'Failed to verify payment');
          setIsLoading(false);
          return;
        }

        if (!data.success || !data.order) {
          console.error('Invalid response format:', data);
          setError('Invalid server response');
          setIsLoading(false);
          return;
        }

        console.log('Payment verified:', { order: data.order });
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify payment');
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Verifying Payment</h2>
          <p className="text-gray-500">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    );
  }



  // If we get here, the payment was verified successfully
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Successful!</h1>
            <p className="mt-4 text-lg text-gray-600">
              Thank you for your order. We have sent a confirmation email with further instructions.
            </p>
            <p className="mt-2 text-gray-500">Order ID: {orderId}</p>
            <div className="mt-8 space-y-4">
              <p className="text-gray-600">
                What happens next:
              </p>
              <ol className="list-decimal text-left ml-8 space-y-2 text-gray-600">
                <li>You will receive an email with your order confirmation and instructions</li>
                <li>Our team will prepare your blood test kit</li>
                <li>The kit will be dispatched to your address</li>
                <li>Follow the instructions in the kit to collect your sample</li>
              </ol>
            </div>
            <div className="mt-8">
              <a
                href="/"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );

}
