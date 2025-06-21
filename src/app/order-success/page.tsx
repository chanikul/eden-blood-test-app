'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const [accountCreated, setAccountCreated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if we have account creation status in local storage
    // This would be set by the success page after API call
    const storedAccountStatus = localStorage.getItem('eden_account_created');
    if (storedAccountStatus) {
      setAccountCreated(storedAccountStatus === 'true');
      // Clear the stored value after reading it
      localStorage.removeItem('eden_account_created');
    } else {
      // Default to showing the dashboard link if we can't determine
      setAccountCreated(true);
    }
  }, []);

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
          
          {accountCreated && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-800">
                Your account has been created successfully! You can now access your dashboard to track your order and view results when they're ready.
              </p>
            </div>
          )}
          
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
          <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
            >
              Return to Home
            </Link>
            
            {accountCreated && (
              <Link 
                href="/client"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
