'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Form from '@radix-ui/react-form';
import * as Select from '@radix-ui/react-select';

import { STRIPE_LINKS } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { stripePaymentLinks } from '@/lib/stripe-links';
import { BloodTest as BloodTestType } from '@/types';
import { BloodTestOrderFormData, bloodTestOrderSchema } from '@/lib/validations/blood-test-order';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { submitBloodTestOrder } from '@/lib/services/blood-test';
import { RedirectingToPayment } from '@/components/RedirectingToPayment';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error('Stripe publishable key is not set');
  throw new Error('Stripe configuration is missing');
}
const stripePromise = loadStripe(stripePublishableKey);

interface BloodTestItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  stripePriceId: string;
  stripeProductId: string;
}

interface BloodTestOrderFormProps {
  tests: BloodTestItem[];
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

export function BloodTestOrderForm({ tests, onSuccess, onError }: BloodTestOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BloodTestOrderFormData>({
    resolver: zodResolver(bloodTestOrderSchema),
    mode: 'all',
  });

  if (!tests || tests.length === 0) {
    return (
      <div className="form-card">
        <p className="form-error">No blood tests available. Please try again later.</p>
      </div>
    );
  }

  const onSubmitForm = async (data: BloodTestOrderFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting form data:', data);

      // Find and log selected test details
      const selectedTest = tests.find(test => test.slug === data.testSlug);
      if (!selectedTest) {
        console.error('Selected test not found:', data.testSlug);
        console.error('Available tests:', tests);
        throw new Error('Selected test not found');
      }

      // Log selected test details
      console.log('Selected test details:', {
        name: selectedTest.name,
        price: selectedTest.price,
        stripePriceId: selectedTest.stripePriceId,
        timestamp: new Date().toISOString()
      });

      // Log all available tests
      console.log('Available tests:', tests.map(test => ({
        name: test.name,
        price: test.price,
        stripePriceId: test.stripePriceId
      })));

      // Create a checkout session
      const requestData = {
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        testSlug: data.testSlug,
        testName: selectedTest.name,
        notes: data.notes,
        mobile: data.mobile,
        stripePriceId: selectedTest.stripePriceId,
        successUrl: `${window.location.origin}/order-success`,
        cancelUrl: window.location.href,
      };

      console.log('Request data:', requestData);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { url, error } = await response.json();
      if (error || !url) {
        throw new Error(error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      console.log('Redirecting to checkout:', url);
      window.location.href = url;
    } catch (err) {
      console.error('Error submitting form:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      } else {
        console.error('Unknown error:', err);
      }
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to submit form. Please try again.'
      );
      if (onError) onError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <Form.Root className="space-y-8" onSubmit={handleSubmit(onSubmitForm)}>
      {/* Your Details Section */}
      <div className="form-section">
        <h2 className="form-title">Your Details</h2>
        
        <div className="space-y-4">
          <Form.Field name="fullName" className="form-group">
            <Form.Label className="form-label">
              Full Name <span className="form-required">*</span>
            </Form.Label>
            <Form.Control asChild>
              <input
                {...register('fullName')}
                className={cn('form-input', errors.fullName && 'border-red-500')}
                data-testid="fullName-input"
                placeholder="Enter your full name"
              />
            </Form.Control>
            {errors.fullName && (
              <Form.Message className="form-error" data-testid="fullName-error">
                {errors.fullName.message}
              </Form.Message>
            )}
          </Form.Field>

          <Form.Field name="email" className="form-group">
            <Form.Label className="form-label">
              Email <span className="form-required">*</span>
            </Form.Label>
            <Form.Control asChild>
              <input
                {...register('email')}
                type="email"
                className={cn('form-input', errors.email && 'border-red-500')}
                data-testid="email-input"
                placeholder="Enter your email address"
              />
            </Form.Control>
            {errors.email && (
              <Form.Message className="form-error" data-testid="email-error">
                {errors.email.message}
              </Form.Message>
            )}
          </Form.Field>

          <Form.Field name="dateOfBirth" className="form-group">
            <Form.Label className="form-label">
              Date of Birth <span className="form-required">*</span>
            </Form.Label>
            <Form.Control asChild>
              <input
                {...register('dateOfBirth')}
                type="date"
                className={cn('form-input', errors.dateOfBirth && 'border-red-500')}
                data-testid="dateOfBirth-input"
              />
            </Form.Control>
            {errors.dateOfBirth && (
              <Form.Message className="form-error" data-testid="dateOfBirth-error">
                {errors.dateOfBirth.message}
              </Form.Message>
            )}
          </Form.Field>

          <Form.Field name="mobile" className="form-group">
            <Form.Label className="form-label">
              Mobile <span className="form-required">*</span>
            </Form.Label>
            <Form.Control asChild>
              <input
                {...register('mobile')}
                type="tel"
                className={cn('form-input', errors.mobile && 'border-red-500')}
                data-testid="mobile-input"
                placeholder="Enter your mobile number"
              />
            </Form.Control>
            {errors.mobile && (
              <Form.Message className="form-error" data-testid="mobile-error">
                {errors.mobile.message}
              </Form.Message>
            )}
          </Form.Field>
        </div>
      </div>

      {/* Choose Your Test Section */}
      <div className="form-section">
        <h2 className="form-section-title">Choose Your Test</h2>
        <Form.Field name="testSlug" className="form-group">
          <Form.Label className="form-label">
            Select a Blood Test <span className="form-required">*</span>
          </Form.Label>
          <Select.Root
            onValueChange={(value) => {
              setValue('testSlug', value, { shouldValidate: true });
              
              // Log selected test details
              const selectedTest = tests.find(test => test.slug === value);
              if (selectedTest) {
                console.log('Test selected:', {
                  name: selectedTest.name,
                  displayPrice: `£${selectedTest.price.toFixed(2)}`,
                  priceInPence: selectedTest.price * 100,
                  stripePriceId: selectedTest.stripePriceId,
                  stripeProductId: selectedTest.stripeProductId,
                  timestamp: new Date().toISOString()
                });
              }
            }}
          >
            <Select.Trigger
              className={cn('form-select', errors.testSlug && 'border-red-500')}
              aria-label="Select a blood test"
              data-testid="blood-test-select"
            >
              <Select.Value>
                <span className="block truncate">
                  {(() => {
                    const selectedSlug = watch('testSlug');
                    const value = tests.find(test => test.slug === selectedSlug);
                    return value ? (
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium">{value.name}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold ml-4">£{value.price.toFixed(2)}</span>
                      </div>
                    ) : (
                      'Choose a test'
                    );
                  })()}
                </span>
              </Select.Value>
              <Select.Icon className="ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content 
                className="overflow-hidden rounded-md border border-gray-200 bg-[rgb(var(--background))] shadow-xl w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]" 
                position="popper"
                sideOffset={4}
                align="center"
              >
                <Select.ScrollUpButton className="flex items-center justify-center h-8 bg-[rgb(var(--background))] cursor-default">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
                  </svg>
                </Select.ScrollUpButton>
                <Select.Viewport className="p-2 max-h-[400px]">
                  {tests.map((test) => (
                    <Select.Item
                      key={test.slug}
                      value={test.slug}
                      className="relative flex cursor-pointer select-none items-center rounded-md py-3 pl-8 pr-8 text-sm outline-none hover:bg-[rgb(var(--muted))] data-[highlighted]:bg-[rgb(var(--primary))] data-[highlighted]:text-white text-[rgb(var(--foreground))] transition-colors"
                      data-testid={`blood-test-option-${test.slug}`}
                    >
                      <Select.ItemText>
                        <div className="flex justify-between items-center w-full">
                          <span>{test.name}</span>
                          <span className="text-gray-500 ml-4">£{test.price.toFixed(2)}</span>
                        </div>
                      </Select.ItemText>
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="flex items-center justify-center h-8 bg-white dark:bg-gray-800 cursor-default">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12L12 8L4 8L8 12Z" fill="currentColor"/>
                  </svg>
                </Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          {errors.testSlug && (
            <Form.Message className="form-error" data-testid="testSlug-error">
              {errors.testSlug.message}
            </Form.Message>
          )}
        </Form.Field>

      </div>

      {/* Extra Notes Section */}
      <div className="form-section">
        <h2 className="form-title">Extra Notes</h2>
        <Form.Field name="notes" className="form-group">
          <Form.Label className="form-label">
            Notes / Comments
          </Form.Label>
          <Form.Control asChild>
            <textarea
              {...register('notes')}
              className={cn('form-textarea', errors.notes && 'border-red-500')}
              rows={4}
              placeholder="Add any additional notes or special requirements"
              data-testid="notes-input"
            />
          </Form.Control>
          {errors.notes && (
            <Form.Message className="form-error">
              {errors.notes.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>

      {/* Consent Checkbox */}
      <div className="mt-6">
        <Form.Field name="consent" className="flex flex-col space-y-2">
          <div className="flex items-start space-x-3">
            <div className="flex items-center space-x-2">
              <Form.Control asChild>
                <input
                  type="checkbox"
                  {...register('consent')}
                  id="consent"
                  className="h-4 w-4 rounded border-gray-300 text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                />
              </Form.Control>
              <Form.Label htmlFor="consent" className="form-checkbox-label">
                I agree to the <a href="/privacy-policy" target="_blank" className="text-[rgb(var(--primary))] hover:underline">Privacy Policy</a> and consent to Eden Clinic processing my data for this order.
              </Form.Label>
            </div>
          </div>
          {errors.consent && (
            <Form.Message className="form-error">
              {errors.consent.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>

      <Form.Submit asChild>
        <button
          type="submit"
          className="form-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </Form.Submit>
    </Form.Root>
  );
}
