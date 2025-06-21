'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Check, CreditCard, User, MapPin } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import styles from './OrderForm.module.css';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface BloodTest {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string;
  isActive: boolean;
  slug: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 'patient-info',
    title: 'Patient Information',
    description: 'We need your details to prepare your test kit'
  },
  {
    id: 'test-selection',
    title: 'Select Blood Test',
    description: 'Choose from our range of comprehensive blood tests'
  },
  {
    id: 'shipping',
    title: 'Shipping Address',
    description: 'Where should we send your test kit?'
  },
  {
    id: 'account',
    title: 'Create Account',
    description: 'Create an account to track your orders and results'
  },
  {
    id: 'review',
    title: 'Review & Pay',
    description: 'Review your order before payment'
  }
];

const orderFormSchema = z.object({
  patientName: z.string().min(1, 'Name is required'),
  patientEmail: z.string().email('Invalid email address'),
  patientDateOfBirth: z.string().min(1, 'Date of birth is required'),
  patientMobile: z.string().optional(),
  testSlug: z.string().min(1, 'Please select a test'),
  notes: z.string().optional(),
  createAccount: z.boolean().default(false),
  password: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Allow empty if createAccount is false
      return val.length >= 8; // Require 8+ chars if provided
    },
    { message: 'Password must be at least 8 characters' }
  ),
  shippingAddress: z.object({
    line1: z.string().min(1, 'Street address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required')
  })
});

type OrderFormData = z.infer<typeof orderFormSchema>;

function getFieldsForStep(step: number): (keyof OrderFormData)[] {
  switch (step) {
    case 0:
      return ['patientName', 'patientEmail', 'patientDateOfBirth', 'patientMobile'];
    case 1:
      return ['testSlug', 'notes'];
    case 2:
      return ['shippingAddress'];
    case 3:
      return ['createAccount', 'password'];
    default:
      return [];
  }
}

export function OrderForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bloodTests, setBloodTests] = useState<BloodTest[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoggedInClient, setIsLoggedInClient] = useState(false);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const router = useRouter();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema) as any, // Cast to any to fix TypeScript error
    mode: 'onBlur',
    defaultValues: {
      patientName: '',
      patientEmail: '',
      patientDateOfBirth: '',
      patientMobile: '',
      testSlug: '',
      notes: '',
      createAccount: false,
      password: '',
      shippingAddress: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    }
  });

  const selectedTest = useMemo(() => {
    const testValue = form.watch('testSlug');
    console.log('Looking for test with value:', testValue);
    console.log('Available tests:', bloodTests);
    
    // If we don't have a test value or blood tests aren't loaded yet, return undefined
    if (!testValue || !bloodTests || bloodTests.length === 0) {
      return undefined;
    }
    
    // First try direct slug match
    let test = bloodTests.find((test) => test.slug === testValue);
    
    // If no match by slug, try by ID (for products where slug might not be set)
    if (!test) {
      test = bloodTests.find((test) => test.id === testValue);
      if (test) {
        console.log('Found test by ID:', test);
      }
    }
    
    // If still no match and the testValue contains a price part (e.g., "Test Name - £90.00")
    if (!test && typeof testValue === 'string' && testValue.includes(' - ')) {
      // Extract the name part before the price
      const namePart = testValue.split(' - ')[0].trim();
      console.log('Trying to find test by name part:', namePart);
      
      // Try to find by exact name match
      test = bloodTests.find((test) => test.name.trim() === namePart);
      
      if (test) {
        console.log('Found test by name:', test);
        // Update the form with the correct value (prefer ID for consistency)
        const valueToSet = test.id || test.slug;
        form.setValue('testSlug', valueToSet, { shouldValidate: true });
      }
    }
    
    if (test) {
      console.log('Selected test found:', test);
    } else {
      console.log('No test found for value:', testValue);
    }
    
    return test;
  }, [bloodTests, form.watch('testSlug')]);
  
  // Debug log whenever selectedTest changes
  useEffect(() => {
    console.log('Selected test updated:', selectedTest);
  }, [selectedTest]);

  async function fetchBloodTests() {
    try {
      setIsLoading(true);
      console.log('Fetching blood tests from API...');
      
      // Try the simplified stripe-products API endpoint first
      let response = await fetch('/api/stripe-products-simple', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // If that fails, try the blood-tests API as fallback
      if (!response.ok) {
        console.log(`Stripe products API failed with status ${response.status}, trying blood-tests API as fallback...`);
        response = await fetch('/api/blood-tests', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
      }
      
      // Parse the response safely even if status is not OK
      // This is important because our API might return mock data with a 200 status
      // even if there was an error fetching from Stripe
      let data;
      try {
        data = await response.json();
        console.log('API response data:', data);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid API response format');
      }
      
      // Handle both API response formats
      let formattedTests = [];
      
      if (data && data.tests && Array.isArray(data.tests)) {
        // Format from blood-tests API
        console.log('Using blood-tests API response format');
        formattedTests = data.tests.map((test: any) => ({
          id: test.id,
          name: test.name,
          description: test.description || '',
          price: test.price || 0,
          stripePriceId: test.stripePriceId || '',
          isActive: test.isActive !== false,
          slug: test.slug || test.id
        }));
      } else if (Array.isArray(data)) {
        // Format from products API
        console.log('Using products API response format');
        
        // Handle the new format from the rebuilt /api/products endpoint
        if (data.length > 0 && data[0].value && data[0].label) {
          console.log('Using new Stripe product endpoint format');
          formattedTests = data.map(product => ({
            id: product.value, // product ID is now in value field
            name: product.label.split(' - ')[0], // Extract name from label
            description: product.description || '',
            price: product.price_amount || 0,
            stripePriceId: product.price_id || '',
            isActive: true, // All products from the endpoint are active
            slug: product.value // Use product ID as slug
          }));
        } else {
          // Direct format from stripe-products-simple API
          formattedTests = data.map((product: any) => ({
            id: product.id || `product_${Math.random().toString(36).substring(2, 9)}`,
            name: product.name || 'Unknown Test',
            description: product.description || '',
            price: product.price || 0,
            stripePriceId: product.stripePriceId || '',
            isActive: product.isActive !== false,
            slug: product.slug || product.id || `test-${Math.random().toString(36).substring(2, 7)}`
          }));
        }
      } else {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid response format');
      }
      
      if (formattedTests.length === 0) {
        console.warn('No blood tests found from API');
        // Use fallback data if API returned empty array
        formattedTests = [
          {
            id: 'mock_prod_1',
            name: 'Complete Blood Count',
            description: 'Comprehensive blood test that checks for a variety of conditions',
            price: 9900,
            stripePriceId: 'price_mock_1',
            isActive: true,
            slug: 'complete-blood-count',
          },
          {
            id: 'mock_prod_2',
            name: 'Liver Function Test',
            description: 'Checks how well your liver is working',
            price: 7900,
            stripePriceId: 'price_mock_2',
            isActive: true,
            slug: 'liver-function-test',
          }
        ];
        console.log('Using fallback blood test data:', formattedTests);
      }
      
      // Filter to only show active tests with valid Stripe price IDs
      const filteredTests = formattedTests.filter((test: any) => {
        // Must be active
        if (!test.isActive) {
          console.log(`Filtering out inactive test: ${test.name}`);
          return false;
        }
        
        // Must have a valid Stripe price ID
        const hasValidStripeId = test.stripePriceId && 
          typeof test.stripePriceId === 'string' && 
          test.stripePriceId.startsWith('price_');
          
        if (!hasValidStripeId) {
          console.log(`Filtering out test with invalid price ID: ${test.name}, ID: ${test.stripePriceId}`);
          return false;
        }
        
        return true;
      });
      
      console.log(`After filtering, ${filteredTests.length} active blood tests with valid Stripe price IDs remain`);
      
      // If filtering removed all tests, use emergency fallback
      if (filteredTests.length === 0) {
        console.warn('All tests were filtered out. Using emergency fallback data.');
        setBloodTests([
          {
            id: 'emergency_fallback_test',
            name: 'Standard Blood Panel',
            description: 'Our standard comprehensive blood test panel',
            price: 9900,
            stripePriceId: 'price_mock_emergency',
            isActive: true,
            slug: 'standard-blood-panel'
          }
        ]);
      } else {
        console.log(`Loaded ${filteredTests.length} blood tests:`, filteredTests);
        setBloodTests(filteredTests);
      }
    } catch (error) {
      console.error('Error fetching blood tests:', error);
      toast.error('Failed to load blood tests. Please refresh the page or try again later.');
      
      // Set fallback data if we have no tests at all
      console.warn('Setting emergency fallback test due to error');
      setBloodTests([
        {
          id: 'error_fallback_test',
          name: 'Standard Blood Test',
          description: 'Our standard comprehensive blood test',
          price: 9900,
          stripePriceId: 'price_mock_error',
          isActive: true,
          slug: 'standard-blood-test'
        },
        {
          id: 'error_fallback_test_2',
          name: 'Hormone Panel',
          description: 'Comprehensive hormone testing panel',
          price: 12900,
          stripePriceId: 'price_mock_error_2',
          isActive: true,
          slug: 'hormone-panel'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to check if client is logged in and has required profile data
  async function checkClientProfileData() {
    console.log('Checking client profile data');
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/client/profile-data/?_=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include' // Ensure cookies are sent
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data response:', data);
        
        // Update state based on API response
        setIsLoggedInClient(data.isLoggedIn);
        setProfileDataLoaded(data.hasProfileData);
        
        if (data.isLoggedIn && data.clientId) {
          setClientId(data.clientId);
          
          // If client is logged in and has profile data, pre-fill email if available
          if (data.email) {
            form.setValue('patientEmail', data.email);
          }
        }
        
        // Auto-skip to Step 1 if client is logged in and has profile data
        if (data.isLoggedIn && data.hasProfileData && currentStep === 0) {
          console.log('Skipping to Step 1 - Client is logged in with profile data');
          setCurrentStep(1);
          setCompletedSteps([0]);
          setShowProfileBanner(true);
        } else if (!data.isLoggedIn && currentStep > 0 && !completedSteps.includes(0)) {
          // Reset to Step 0 if not logged in but somehow on a later step
          console.log('Resetting to Step 0 - Client is not logged in');
          setCurrentStep(0);
          setShowProfileBanner(false);
        }
      } else {
        console.error('Failed to fetch profile data');
        // Reset to Step 0 on error if we haven't completed it yet
        if (currentStep > 0 && !completedSteps.includes(0)) {
          setCurrentStep(0);
          setShowProfileBanner(false);
        }
      }
    } catch (error) {
      console.error('Error checking client profile data:', error);
      // Reset to Step 0 on error if we haven't completed it yet
      if (currentStep > 0 && !completedSteps.includes(0)) {
        setCurrentStep(0);
        setShowProfileBanner(false);
      }
    }
  }

  useEffect(() => {
    fetchBloodTests();
    
    // Reset state on mount
    setIsLoggedInClient(false);
    setProfileDataLoaded(false);
    setClientId(null);
    setShowProfileBanner(false);
    
    // Check client profile data with a small delay to ensure cookies are loaded
    const timer = setTimeout(() => {
      checkClientProfileData();
    }, 100);
    
    // Clean up function to reset state and clear timeout
    return () => {
      clearTimeout(timer);
      setIsLoggedInClient(false);
      setProfileDataLoaded(false);
      setClientId(null);
      setShowProfileBanner(false);
    };
  }, []);

  const isStepValid = async (step: number) => {
    const fields = getFieldsForStep(step);
    
    // Special handling for test selection step
    if (step === 1) {
      // Make sure we have a valid test selected
      const testValue = form.getValues('testSlug');
      if (!testValue) {
        form.setError('testSlug', {
          type: 'manual',
          message: 'Please select a blood test'
        });
        return false;
      }
      
      // Directly use selectedTest from useMemo if available
      if (selectedTest) {
        console.log('Test validation passed: using selectedTest:', selectedTest);
        return true;
      }
      
      // Otherwise verify that the selected test exists in our list - check both slug and ID
      const testExists = bloodTests.some(test => 
        (test.slug && test.slug === testValue) || test.id === testValue
      );
      
      if (!testExists) {
        form.setError('testSlug', {
          type: 'manual',
          message: 'Please select a valid blood test from the list'
        });
        console.error('Test validation failed: could not find test with slug/id:', testValue);
        return false;
      }
      
      console.log('Test validation passed for value:', testValue);
    }
    
    const result = await form.trigger(fields as any);
    return result;
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = async () => {
    const isValid = await isStepValid(currentStep);
    console.log(`Step ${currentStep} validation:`, isValid);
    
    if (!isValid) {
      // Show which fields are invalid
      const fields = getFieldsForStep(currentStep);
      fields.forEach(field => {
        const error = form.formState.errors[field as keyof OrderFormData];
        if (error) {
          console.log(`Field ${field} error:`, error);
        }
      });
      toast.error('Please complete all required fields');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      console.log('Form submission started with data:', data);
      
      // Validate the current step before submission
      const isValid = await isStepValid(currentStep);
      if (!isValid) {
        toast.error('Please complete all required fields');
        console.error('Form validation failed');
        return;
      }

      // Find the selected test
      // First, try to use the selectedTest from the useMemo hook
      let test = selectedTest;
      
      if (!test) {
        // If no test is selected via the hook, try to find it directly from the form data
        const testValue = data.testSlug; // This could be either a slug or an ID
        console.log('No selected test found, trying to find by slug/id:', testValue);
        
        if (testValue) {
          // Try to find by exact slug match first
          test = bloodTests.find(t => t.slug === testValue);
          
          // If not found by slug, try by ID
          if (!test) {
            test = bloodTests.find(t => t.id === testValue);
            if (test) {
              console.log('Found test by ID:', test);
            }
          }
          
          // If not found and the value might be the display text (containing price info)
          if (!test && testValue.includes(' - ')) {
            const namePart = testValue.split(' - ')[0].trim();
            console.log('Trying to find test by name part:', namePart);
            test = bloodTests.find(t => t.name.trim() === namePart);
            if (test) {
              console.log('Found test by name part:', test);
            }
          }
        }
      }
      
      // If we still don't have a test, try to find the first test that matches the name
      if (!test && bloodTests.length > 0) {
        console.log('Attempting to find any valid test in the list');
        // Just use the first test as a fallback
        test = bloodTests[0];
        console.log('Using fallback test:', test);
      }
      
      if (!test) {
        toast.error('Please select a valid blood test');
        console.error('No valid test selected. Available tests:', bloodTests);
        console.error('Current test slug:', data.testSlug);
        return;
      }
      
      console.log('Found test for checkout:', test);

      // Check if stripePriceId exists
      if (!test.stripePriceId) {
        toast.error('Invalid test selection. Missing price information.');
        console.error('Missing stripePriceId for test:', test);
        return;
      }

      setIsLoading(true);
      
      const requestData = {
        fullName: data.patientName,
        email: data.patientEmail,
        dateOfBirth: data.patientDateOfBirth,
        mobile: data.patientMobile,
        testSlug: test.slug,
        testName: test.name,
        stripePriceId: test.stripePriceId,
        // Add the missing required fields
        price: test.price, // Price in pence (smallest currency unit) as expected by Stripe
        productId: test.id,
        notes: data.notes,
        createAccount: data.createAccount,
        password: data.createAccount ? data.password : undefined,
        shippingAddress: data.shippingAddress,
        successUrl: `${window.location.origin}/order-success`,
        cancelUrl: window.location.href
      };
      
      console.log('Prepared checkout request data:', requestData);

      console.log('Full request data:', requestData);

      // Validate that stripePriceId is present and valid
      if (!requestData.stripePriceId || requestData.stripePriceId.trim() === '') {
        toast.error('Invalid price information. Please select a different test.');
        console.error('Missing or empty stripePriceId:', requestData.stripePriceId);
        setIsLoading(false);
        return;
      }

      console.log('Sending checkout request:', requestData);
      
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include', // Include cookies for authentication
        });

        // Log the raw response for debugging
        console.log('Checkout API response status:', response.status);
        
        const responseData = await response.json();
        console.log('Checkout API response data:', responseData);
        
        if (!response.ok) {
          console.error('Checkout API error:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
          });
          throw new Error(responseData.error || 'Failed to create checkout session');
        }

        if (!responseData.url) {
          throw new Error('No checkout URL returned from the server');
        }

        console.log('Redirecting to checkout:', responseData.url);
        window.location.href = responseData.url;
      } catch (error) {
        console.error('Error during checkout request:', error);
        toast.error('Failed to create checkout session. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Profile data banner component to show when client data is loaded
  const ProfileDataBanner = () => {
    if (!showProfileBanner) return null;
    
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700 text-sm">Your patient details have been loaded from your profile.</p>
          <button 
            onClick={() => setShowProfileBanner(false)}
            className="ml-auto text-green-500 hover:text-green-700"
            aria-label="Dismiss"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.formContainer}>
      {/* Profile Data Banner */}
      {currentStep === 1 && <ProfileDataBanner />}
      
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        {steps.map((step, index) => (
          <div key={step.title} className={styles.progressStep}>
            <div className={cn(styles.stepIcon, {
              [styles.completed]: completedSteps.includes(index),
              [styles.active]: currentStep === index
            })}>
              {completedSteps.includes(index) ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className={styles.stepInfo}>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepDescription}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        {/* Step 1: Personal Details */}
        {currentStep === 0 && (
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>{steps[currentStep].title}</h2>
            <p className={styles.formSubtitle}>{steps[currentStep].description}</p>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputHint}>Enter your name as it appears on your ID</div>
              <input
                type="text"
                id="patientName"
                {...form.register('patientName')}
                className={styles.input}
              />
              {form.formState.errors.patientName && (
                <span className={styles.error}>{form.formState.errors.patientName.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputHint}>We'll send your results and order updates here</div>
              <input
                type="email"
                id="patientEmail"
                {...form.register('patientEmail')}
                className={styles.input}
              />
              {form.formState.errors.patientEmail && (
                <span className={styles.error}>{form.formState.errors.patientEmail.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Date of Birth</label>
              <div className={styles.inputHint}>Required by our clinicians to issue your prescription</div>
              <input
                type="date"
                id="patientDateOfBirth"
                {...form.register('patientDateOfBirth')}
                className={styles.input}
              />
              {form.formState.errors.patientDateOfBirth && (
                <span className={styles.error}>{form.formState.errors.patientDateOfBirth.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Mobile Number</label>
              <div className={styles.inputHint}>For delivery updates and important notifications</div>
              <input
                type="tel"
                id="patientMobile"
                {...form.register('patientMobile')}
                className={styles.input}
              />
              {form.formState.errors.patientMobile && (
                <span className={styles.error}>{form.formState.errors.patientMobile.message}</span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Test Selection */}
        {currentStep === 1 && (
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>{steps[currentStep].title}</h2>
            <p className={styles.formSubtitle}>{steps[currentStep].description}</p>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Blood Test</label>
              <div className={styles.inputHint}>Choose from our range of comprehensive blood tests</div>
              <select
                id="testSlug"
                className={styles.select}
                value={form.watch('testSlug') || ''}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  console.log('Selected value from dropdown:', selectedValue);
                  
                  if (selectedValue) {
                    // Find the selected test by slug or id
                    const test = bloodTests.find((t) => 
                      (t.slug && t.slug === selectedValue) || t.id === selectedValue
                    );
                    
                    if (test) {
                      console.log('Found test:', test);
                      // Always use the ID for consistency - this is what Stripe uses
                      const valueToSet = test.id;
                      form.setValue('testSlug', valueToSet, { shouldValidate: true });
                      console.log('Set form value to ID:', valueToSet);
                      console.log('Test details - name:', test.name, 'price:', test.price, 'stripePriceId:', test.stripePriceId);
                      
                      // Clear any previous errors
                      form.clearErrors('testSlug');
                    } else {
                      console.error('Could not find test with value:', selectedValue);
                      form.setValue('testSlug', selectedValue, { shouldValidate: true });
                    }
                  } else {
                    // Handle empty selection
                    form.setValue('testSlug', '', { shouldValidate: true });
                  }
                }}
              >
                <option value="">Select a test...</option>
                {bloodTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.name} - £{test.price > 0 ? (test.price / 100).toFixed(2) : 'TBD'}
                  </option>
                ))}
              </select>
              {form.formState.errors.testSlug && (
                <span className={styles.error}>{form.formState.errors.testSlug.message}</span>
              )}

              {form.watch('testSlug') && (
                <div className={styles.selectedTestInfo}>
                  {(() => {
                    const test = bloodTests.find(t => t.slug === form.watch('testSlug'));
                    return test ? (
                      <p className={styles.testDescription}>{test.description}</p>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="notes">Additional Notes (Optional)</label>
              <div className={styles.inputHint}>Any specific requirements or information we should know</div>
              <textarea
                id="notes"
                {...form.register('notes')}
                className={styles.textarea}
                placeholder="Enter any additional notes here..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Shipping Address */}
        {currentStep === 2 && (
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>{steps[currentStep].title}</h2>
            <p className={styles.formSubtitle}>{steps[currentStep].description}</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Delivery Address</label>
              <div className={styles.inputHint}>Enter your address for test kit delivery</div>
              <AddressAutocomplete
                onAddressSelect={(address) => {
                  form.setValue('shippingAddress.line1', address.line1);
                  if (address.line2) {
                    form.setValue('shippingAddress.line2', address.line2);
                  }
                  form.setValue('shippingAddress.city', address.city);
                  form.setValue('shippingAddress.state', address.state);
                  form.setValue('shippingAddress.postalCode', address.postalCode);
                  form.setValue('shippingAddress.country', address.country);
                }}
                error={form.formState.errors.shippingAddress?.line1?.message}
              />
            </div>

            {/* Show the complete address if all fields are filled */}
            {form.watch('shippingAddress.line1') && (
              <div className={styles.addressSummary}>
                <div className={styles.addressLine}>{form.watch('shippingAddress.line1')}</div>
                {form.watch('shippingAddress.line2') && (
                  <div className={styles.addressLine}>{form.watch('shippingAddress.line2')}</div>
                )}
                <div className={styles.addressLine}>
                  {form.watch('shippingAddress.city')}
                  {form.watch('shippingAddress.state') && `, ${form.watch('shippingAddress.state')}`}
                </div>
                <div className={styles.addressLine}>{form.watch('shippingAddress.postalCode')}</div>
                <div className={styles.addressLine}>{form.watch('shippingAddress.country')}</div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Account Setup */}
        {currentStep === 3 && (
          <div className={styles.formSection}>
            <h2 className={styles.formTitle}>{steps[currentStep].title}</h2>
            <p className={styles.formSubtitle}>{steps[currentStep].description}</p>

            <div className={styles.inputGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="createAccount"
                  {...form.register('createAccount')}
                  className={styles.checkbox}
                />
                <label htmlFor="createAccount" className={styles.checkboxLabel}>
                  Create an account to track your orders and access your results
                </label>
              </div>
            </div>

            {form.watch('createAccount') && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputHint}>Choose a secure password for your account</div>
                <input
                  type="password"
                  id="password"
                  {...form.register('password')}
                  className={styles.input}
                  placeholder="Enter a secure password"
                />
                {form.formState.errors.password && (
                  <span className={styles.error}>{form.formState.errors.password.message}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.buttonGroup}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className={styles.buttonSecondary}
            >
              Previous
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className={styles.buttonPrimary}
            >
              Next
            </button>
          ) : (
            <button
              type="button" /* Changed from type="submit" to type="button" */
              onClick={() => {
                console.log('Proceed to Payment clicked');
                console.log('Form state:', form.formState);
                console.log('Form values:', form.getValues());
                form.handleSubmit(onSubmit)();
              }}
              className={styles.buttonPrimary}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
