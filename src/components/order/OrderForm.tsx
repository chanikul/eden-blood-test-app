import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderFormSchema, type OrderFormData } from '@/lib/validations/order-form';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const steps = [
  'Personal Details',
  'Choose Test',
  'Account Setup (Optional)',
  'Payment'
] as const;

export function OrderForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      createAccount: false,
      shippingAddress: {
        country: 'United Kingdom'
      }
    }
  });

  const onSubmit = async (data: OrderFormData) => {
    try {
      const response = await fetch('/api/order-blood-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, url } = await response.json();
      
      if (url) {
        router.push(url); // Redirect to Stripe checkout
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const nextStep = () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = fields.every(field => !form.formState.errors[field]);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      form.trigger(fields);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): Array<keyof OrderFormData> => {
    switch (step) {
      case 0:
        return ['patientName', 'patientEmail', 'patientDateOfBirth', 'patientMobile'];
      case 1:
        return ['testSlug', 'notes'];
      case 2:
        return ['createAccount', 'password'];
      case 3:
        return ['shippingAddress'];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${idx <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'}
              `}>
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`
                  h-1 w-full mx-2
                  ${idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span key={step} className="text-sm text-gray-600">
              {step}
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Personal Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                {...form.register('patientName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {form.formState.errors.patientName && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.patientName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...form.register('patientEmail')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {form.formState.errors.patientEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.patientEmail.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                {...form.register('patientDateOfBirth')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {form.formState.errors.patientDateOfBirth && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.patientDateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mobile (Optional)
              </label>
              <input
                type="tel"
                {...form.register('patientMobile')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Choose Test */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Blood Test
              </label>
              <select
                {...form.register('testSlug')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Select a test...</option>
                {/* Add blood test options dynamically */}
              </select>
              {form.formState.errors.testSlug && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.testSlug.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                {...form.register('notes')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Account Setup */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                Create an account to track your order and access test results later
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...form.register('createAccount')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Create an account for faster checkout and order tracking
              </label>
            </div>

            {form.watch('createAccount') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  {...form.register('password')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="At least 8 characters"
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Shipping Address */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                type="text"
                {...form.register('shippingAddress.line1')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              {form.formState.errors.shippingAddress?.line1 && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.shippingAddress.line1.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                {...form.register('shippingAddress.line2')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  {...form.register('shippingAddress.city')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                {form.formState.errors.shippingAddress?.city && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.shippingAddress.city.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  County/State
                </label>
                <input
                  type="text"
                  {...form.register('shippingAddress.state')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                {form.formState.errors.shippingAddress?.state && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.shippingAddress.state.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...form.register('shippingAddress.postalCode')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                {form.formState.errors.shippingAddress?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.shippingAddress.postalCode.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  {...form.register('shippingAddress.country')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`
              px-4 py-2 rounded-md text-sm font-medium
              ${currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Proceed to Payment
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
