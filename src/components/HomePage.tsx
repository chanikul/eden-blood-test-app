'use client';

import { BloodTestOrderForm } from './forms/BloodTestOrderForm';
import LoadingSpinner from './LoadingSpinner';

interface BloodTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  stripePriceId: string;
  stripeProductId: string;
}

interface HomePageProps {
  tests: BloodTest[];
  isLoading?: boolean;
}

export function HomePage({ tests, isLoading = false }: HomePageProps) {
  console.log('HomePage received tests:', tests);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <div className="form-container">
          <div className="form-card">
            <div className="text-center mb-8">
              <img
                src="/Eden-Clinic-For-White-Background.png"
                alt="Eden Clinic"
                className="h-16 w-auto object-contain mx-auto dark:invert mb-6"
              />
            </div>
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <div className="form-container">
          <div className="form-card">
            <div className="text-center space-y-8">
              <img
                src="/Eden-Clinic-For-White-Background.png"
                alt="Eden Clinic"
                className="h-16 w-auto object-contain mx-auto dark:invert mb-6"
              />
              <h1 className="text-3xl font-semibold">Welcome to Eden Clinic</h1>
              <p className="text-gray-600 text-lg">Our blood tests are currently being updated. Please check back soon.</p>
              <div className="mt-8">
                <a
                  href="/contact"
                  className="text-primary-600 hover:text-primary-700 font-medium text-lg"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
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
          <BloodTestOrderForm tests={tests} />
        </div>
      </div>
    </div>
  );
}
