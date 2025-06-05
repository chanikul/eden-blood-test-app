'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Check, CreditCard, User, MapPin } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import styles from './OrderForm.module.css';
import { cn } from '../../lib/utils';
import { AddressAutocomplete } from '../AddressAutocomplete';

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
  const router = useRouter();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
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
    const testSlug = form.watch('testSlug');
    return bloodTests?.find((test) => test.slug === testSlug);
  }, [bloodTests, form.watch('testSlug')]);

  async function fetchBloodTests() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch blood tests');
      }
      const data = await response.json();
      // The products API returns an array directly, not wrapped in a 'tests' property
      if (Array.isArray(data)) {
        // Only include products that have type: blood_test in their metadata
        const bloodTestProducts = data.filter(product => 
          product.metadata && product.metadata.type === 'blood_test'
        );
        
        console.log('Blood test products with type=blood_test:', bloodTestProducts);
        
        // Map the Stripe product format to the BloodTest format expected by the form
        const formattedTests = bloodTestProducts.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          stripePriceId: product.priceId || '',
          isActive: product.active !== false,
          slug: product.slug
        }));
        
        console.log('Formatted blood tests for form:', formattedTests);
        setBloodTests(formattedTests);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching blood tests:', error);
      toast.error('Failed to load blood tests');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBloodTests();
  }, []);

  const isStepValid = async (step: number): Promise<boolean> => {
    const fields = getFieldsForStep(step);
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
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    try {
      if (!selectedTest) {
        toast.error('Please select a blood test');
        return;
      }

      setIsLoading(true);
      
      const requestData = {
        fullName: data.patientName,
        email: data.patientEmail,
        dateOfBirth: data.patientDateOfBirth,
        mobile: data.patientMobile,
        testSlug: selectedTest.slug,
        testName: selectedTest.name,
        stripePriceId: selectedTest.stripePriceId,
        // Add the missing required fields
        price: selectedTest.price,
        productId: selectedTest.id,
        notes: data.notes,
        createAccount: data.createAccount,
        password: data.createAccount ? data.password : undefined,
        shippingAddress: data.shippingAddress,
        successUrl: `${window.location.origin}/order-success`,
        cancelUrl: window.location.href
      };

      console.log('Full request data:', requestData);

      console.log('Sending checkout request:', requestData);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      
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

  return (
    <div className={styles.formContainer}>
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
                {...form.register('testSlug')}
                className={styles.select}
                onChange={(e) => {
                  form.setValue('testSlug', e.target.value);
                  const selectedTest = bloodTests.find(test => test.slug === e.target.value);
                  if (selectedTest) {
                    // You could add additional logic here if needed
                  }
                }}
              >
                <option value="">Select a test...</option>
                {bloodTests.map((test) => (
                  <option key={test.id} value={test.slug}>
                    {test.name} - £{test.price > 0 ? test.price.toFixed(2) : 'TBD'}
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
              type="submit"
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
