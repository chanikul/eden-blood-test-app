'use client';

import { BloodTestOrderFormWrapper } from './BloodTestOrderFormWrapper';

interface BloodTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
}

interface HomePageProps {
  tests: BloodTest[];
}

export function HomePage({ tests }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <BloodTestOrderFormWrapper tests={tests} />
        </div>
      </div>
    </div>
  );
}
