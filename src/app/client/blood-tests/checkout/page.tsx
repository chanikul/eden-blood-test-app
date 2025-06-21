'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Loader2,
  AlertCircle,
  ChevronLeft,
  CreditCard
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

export default function CheckoutPage() {
  const [bloodTest, setBloodTest] = useState<BloodTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    mobile: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const testSlug = searchParams.get('test');

  useEffect(() => {
    if (!testSlug) {
      setError('No blood test selected. Please go back and select a test.');
      setLoading(false);
      return;
    }

    async function fetchBloodTest() {
      try {
        setLoading(true);
        const response = await fetch('/api/blood-tests');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blood test details');
        }
        
        const data = await response.json();
        const selectedTest = data.tests.find((test: BloodTest) => test.slug === testSlug);
        
        if (!selectedTest) {
          throw new Error('Selected blood test not found');
        }
        
        setBloodTest(selectedTest);
      } catch (err) {
        console.error('Error fetching blood test:', err);
        setError('Failed to load blood test details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBloodTest();
  }, [testSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Max age 120 years
      
      if (isNaN(dobDate.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date';
      } else if (dobDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      } else if (dobDate < minDate) {
        errors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!bloodTest) {
      setError('No blood test selected');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/order-blood-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testSlug: bloodTest.slug,
          fullName: formData.fullName,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          mobile: formData.mobile || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL provided');
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to process your order. Please try again.');
      setSubmitting(false);
    }
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
        <span className="ml-2 text-gray-600">Loading checkout...</span>
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
          onClick={() => router.back()}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-teal-600 hover:text-teal-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Blood Tests
      </button>
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>
      
      {bloodTest && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-6">
            <div>
              <h3 className="font-medium">{bloodTest.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{bloodTest.description || 'No description available'}</p>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(bloodTest.price)}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name*
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth*
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.dateOfBirth}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number (optional)
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex items-center justify-center px-4 py-2 rounded text-white ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-2">Important Information</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
          <li>Your blood test kit will be dispatched within 1-2 business days.</li>
          <li>You'll receive instructions on how to collect your sample safely.</li>
          <li>Results are typically available within 3-5 days after we receive your sample.</li>
          <li>You'll be notified by email when your results are ready to view.</li>
          <li>For any questions, please contact our support team.</li>
        </ul>
      </div>
    </div>
  );
}
