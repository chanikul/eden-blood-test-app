'use client';

import { useState } from 'react';
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
import { submitBloodTestOrder } from '@/lib/services/blood-test';
import { RedirectingToPayment } from '@/components/RedirectingToPayment';

interface BloodTestItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
}

interface BloodTestOrderFormProps {
  tests: BloodTestItem[];
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

export function BloodTestOrderForm({ tests, onSuccess, onError }: BloodTestOrderFormProps) {
  console.log('BloodTestOrderForm received tests:', tests);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BloodTestOrderFormData>({
    resolver: zodResolver(bloodTestOrderSchema),
    mode: 'all', // Show validation errors immediately
  });

  const onSubmitForm = async (data: BloodTestOrderFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting form data:', data);

      // Find the selected test from the tests array
      const selectedTest = tests.find(test => test.slug === data.testSlug);
      if (!selectedTest) {
        console.error('Selected test not found:', data.testSlug);
        console.error('Available tests:', tests);
        throw new Error('Selected test not found');
      }

      // Create a checkout session
      const requestData = {
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        testName: selectedTest.name,
        notes: data.notes,
        mobile: data.mobile,
        price: selectedTest.price * 100, // Convert to pence
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
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Details</h2>
        <Form.Field name="fullName">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Full Name *
          </Form.Label>
          <Form.Control asChild>
            <input
              {...register('fullName')}
              data-testid="fullName-input"
              className={cn(
                'mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500',
                errors.fullName && 'border-red-500'
              )}
            />
          </Form.Control>
          {errors.fullName && (
            <Form.Message className="mt-1 text-sm text-red-500" data-testid="fullName-error">
              {errors.fullName.message}
            </Form.Message>
          )}
        </Form.Field>

        <Form.Field name="email">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Email *
          </Form.Label>
          <Form.Control asChild>
            <input
              {...register('email')}
              type="email"
              data-testid="email-input"
              className={cn(
                'mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500',
                errors.email && 'border-red-500'
              )}
            />
          </Form.Control>
          {errors.email && (
            <Form.Message className="mt-1 text-sm text-red-500" data-testid="email-error">
              {errors.email.message}
            </Form.Message>
          )}
        </Form.Field>

        <Form.Field name="dateOfBirth">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Date of Birth *
          </Form.Label>
          <Form.Control asChild>
            <input
              {...register('dateOfBirth')}
              type="date"
              data-testid="dateOfBirth-input"
              className={cn(
                'mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500',
                errors.dateOfBirth && 'border-red-500'
              )}
            />
          </Form.Control>
          {errors.dateOfBirth && (
            <Form.Message className="mt-1 text-sm text-red-500" data-testid="dateOfBirth-error">
              {errors.dateOfBirth.message}
            </Form.Message>
          )}
        </Form.Field>

        <Form.Field name="mobile">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Mobile
          </Form.Label>
          <Form.Control asChild>
            <input
              {...register('mobile')}
              type="tel"
              data-testid="mobile-input"
              className={cn(
                'mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500',
                errors.mobile && 'border-red-500'
              )}
            />
          </Form.Control>
          {errors.mobile && (
            <Form.Message className="mt-1 text-sm text-red-500" data-testid="mobile-error">
              {errors.mobile.message}
            </Form.Message>
          )}
        </Form.Field>

      </div>

      {/* Choose Your Test Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Choose Your Test</h2>
        <Form.Field name="testSlug">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Select a Blood Test *
          </Form.Label>
          <Select.Root
            onValueChange={(value) => {
              setValue('testSlug', value, { shouldValidate: true });
            }}
          >
            <Select.Trigger
              className={cn(
                'mt-1 inline-flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900',
                errors.testSlug && 'border-red-500'
              )}
              aria-label="Select a blood test"
              data-testid="blood-test-select"
            >
              <Select.Value placeholder="Choose a test" />
              <Select.Icon className="ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-gray-500"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content 
                className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]" 
                position="item-aligned"
                sideOffset={4}
              >
                <Select.Viewport className="p-1 max-h-[400px]">
                  {tests.map((test) => (
                    <Select.Item
                      key={test.slug}
                      value={test.slug}
                      className="relative flex cursor-pointer select-none items-center rounded-md py-3 pl-8 pr-8 text-sm outline-none hover:bg-gray-50 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 text-gray-700 transition-colors"
                      data-testid={`blood-test-option-${test.slug}`}
                    >
                      <Select.ItemText>{test.name}</Select.ItemText>
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
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          {errors.testSlug && (
            <Form.Message className="mt-1 text-sm text-red-500" data-testid="testSlug-error">
              {errors.testSlug.message}
            </Form.Message>
          )}
        </Form.Field>

      </div>

      {/* Extra Notes Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Extra Notes</h2>
        <Form.Field name="notes">
          <Form.Label className="block text-sm font-medium text-gray-700">
            Notes / Comments
          </Form.Label>
          <Form.Control asChild>
            <textarea
              {...register('notes')}
              rows={4}
              className={cn(
                'mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500 min-h-[100px]',
                errors.notes && 'border-red-500'
              )}
            />
          </Form.Control>
          {errors.notes && (
            <Form.Message className="mt-1 text-sm text-red-500">
              {errors.notes.message}
            </Form.Message>
          )}
        </Form.Field>
      </div>

      {/* Consent Checkbox */}
      <div className="mt-6">
        <Form.Field name="consent" className="flex items-start space-x-3">
          <Form.Control asChild>
            <input
              type="checkbox"
              {...register('consent')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </Form.Control>
          <Form.Label className="text-sm text-gray-600">
            I agree to the{' '}
            <a
              href="/privacy-policy"
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{' '}
            and consent to Eden Clinic processing my data for this order.
          </Form.Label>
        </Form.Field>
        {errors.consent && (
          <Form.Message className="mt-1 text-sm text-red-500">
            {errors.consent.message}
          </Form.Message>
        )}
      </div>

      <Form.Submit asChild>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#B4D4C3] px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#A3C3B2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4D4C3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </Form.Submit>
    </Form.Root>
  );
}
