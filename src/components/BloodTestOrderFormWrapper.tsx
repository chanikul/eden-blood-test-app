'use client';

import React from 'react';
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
  console.log('BloodTestOrderFormWrapper received tests:', tests);
  const handleSuccess = (orderId: string) => {
    // Success will be handled by the form component's redirect
  };

  const handleError = (error: Error) => {
    // Error will be handled by the form component's toast
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="text-center mb-8">
          <img
            src="/Eden-Clinic-For-White-Background.png"
            alt="Eden Clinic"
            className="h-16 w-auto object-contain mx-auto dark:invert mb-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              // Fallback to text if image fails to load
              const title = document.createElement('h1');
              title.className = 'text-3xl font-semibold text-[rgb(var(--foreground))]';
              title.textContent = 'Eden Clinic';
              e.currentTarget.parentElement?.appendChild(title);
            }}
          />
          <div className="form-header">
            <h1>Order Your Eden Clinic Blood Test Kit</h1>
            <p>We'll send your kit to you after checkout. You can use your preferred clinic for the blood draw.</p>
          </div>
        </div>
        <BloodTestOrderForm tests={tests} onSuccess={handleSuccess} onError={handleError} />
      </div>
    </div>
  );
}
