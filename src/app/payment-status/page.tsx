'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PaymentStatus() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || null;
  const success = searchParams?.get('success') || null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {error === 'payment_pending' ? (
          <>
            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Payment Pending</h2>
            <p className="text-gray-600 mb-4">
              Your payment is being processed. We&apos;ll notify you once it&apos;s confirmed.
            </p>
          </>
        ) : error ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment. Please try again.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your payment. Your order has been confirmed.
            </p>
          </>
        )}
        <Link
          href="/"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
