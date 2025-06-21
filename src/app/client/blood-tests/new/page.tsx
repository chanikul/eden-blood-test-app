'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TestTube2,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface BloodTest {
  id: string;
  name: string;
  price: number;
  description: string;
  slug: string;
  isActive: boolean;
  stripePriceId: string;
}

export default function OrderBloodTestPage() {
  const [bloodTests, setBloodTests] = useState<BloodTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function fetchBloodTests() {
      try {
        setLoading(true);
        const response = await fetch('/api/blood-tests');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blood tests');
        }
        
        const data = await response.json();
        // Filter only active blood tests with valid Stripe price IDs (starting with "price_")
        const activeTests = data.tests.filter((test: BloodTest) => 
          test.isActive && 
          test.stripePriceId && 
          test.stripePriceId.startsWith('price_')
        );
        setBloodTests(activeTests);
      } catch (err) {
        console.error('Error fetching blood tests:', err);
        setError('Failed to load available blood tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBloodTests();
  }, []);

  const handleContinue = () => {
    if (!selectedTest) {
      setError('Please select a blood test to continue');
      return;
    }
    
    router.push(`/client/blood-tests/checkout?test=${selectedTest}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading available tests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bloodTests.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-yellow-700">No blood tests are currently available. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Order a Blood Test</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Blood Test</h2>
        
        <div className="space-y-4">
          {bloodTests.map((test) => (
            <div 
              key={test.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedTest === test.slug 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 hover:border-teal-300'
              }`}
              onClick={() => setSelectedTest(test.slug)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    selectedTest === test.slug ? 'bg-teal-500' : 'border border-gray-300'
                  }`}>
                    {selectedTest === test.slug && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{test.description || 'No description available'}</p>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPrice(test.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={handleContinue}
            disabled={!selectedTest}
            className={`w-full flex items-center justify-center px-4 py-2 rounded text-white ${
              selectedTest 
                ? 'bg-teal-600 hover:bg-teal-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Checkout
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
          <li>Complete your order and payment</li>
          <li>We'll send you a blood test kit by mail</li>
          <li>Follow the instructions to collect your sample</li>
          <li>Return your sample using the prepaid envelope</li>
          <li>We'll notify you when your results are ready</li>
        </ol>
      </div>
    </div>
  );
}
