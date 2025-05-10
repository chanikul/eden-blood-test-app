'use client';

import { BloodTestOrderForm } from './forms/BloodTestOrderForm';
interface BloodTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
}

interface BloodTestOrderFormWrapperProps {
  tests: BloodTest[];
}

export function BloodTestOrderFormWrapper({ tests }: BloodTestOrderFormWrapperProps) {
  const handleSuccess = (orderId: string) => {
    // Success will be handled by the form component's redirect
  };

  const handleError = (error: Error) => {
    // Error will be handled by the form component's toast
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-6 mb-8">
          <div className="flex justify-center">
            <img
              src="/Eden-Clinic-For-White-Background.png"
              alt="Eden Clinic"
              className="h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                // Fallback to text if image fails to load
                const title = document.createElement('h1');
                title.className = 'text-3xl font-semibold text-gray-900';
                title.textContent = 'Eden Clinic Blood Tests';
                e.currentTarget.parentElement?.appendChild(title);
              }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Order Your Eden Clinic Blood Test Kit
            </h1>
            <p className="text-gray-600 text-lg">
              We'll send your kit to you after checkout. You can use your preferred clinic for the blood draw.
            </p>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-6 sm:p-8 border border-gray-100">
          <BloodTestOrderForm
            tests={tests}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
}
