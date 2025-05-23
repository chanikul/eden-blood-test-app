'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: Date;
  nextBillingDate?: Date;
  amount: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      name: 'Premium Health Plan',
      status: 'ACTIVE',
      startDate: new Date('2025-01-01'),
      nextBillingDate: new Date('2025-06-01'),
      amount: 29.99,
      interval: 'monthly',
      features: [
        'Unlimited blood tests',
        'Priority booking',
        'Free travel letters',
        '24/7 GP access',
      ],
    },
  ]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const getStatusBadge = (status: Subscription['status']) => {
    const styles = {
      ACTIVE: 'text-green-600 bg-green-50',
      CANCELLED: 'text-amber-600 bg-amber-50',
      EXPIRED: 'text-red-600 bg-red-50',
    };

    const icons = {
      ACTIVE: <CheckCircle2 className="h-4 w-4 mr-1" />,
      CANCELLED: <Clock className="h-4 w-4 mr-1" />,
      EXPIRED: <AlertCircle className="h-4 w-4 mr-1" />,
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const handleCancel = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (selectedSubscription) {
      // TODO: API call to cancel subscription
      setSubscriptions(subscriptions.map(sub =>
        sub.id === selectedSubscription.id
          ? { ...sub, status: 'CANCELLED' as const }
          : sub
      ));
      setShowCancelModal(false);
      setSelectedSubscription(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Memberships & Subscriptions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your health plans and subscriptions
        </p>
      </div>

      <div className="grid gap-6">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white shadow-sm rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-1">
                  {getStatusBadge(subscription.status)}
                </div>
                <h2 className="text-xl font-medium text-gray-900">
                  {subscription.name}
                </h2>
                <div className="mt-2 space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    £{subscription.amount}
                    <span className="text-sm font-normal text-gray-500">
                      /{subscription.interval}
                    </span>
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Started: {subscription.startDate.toLocaleDateString()}
                  </div>
                  {subscription.nextBillingDate && subscription.status === 'ACTIVE' && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Next billing: {subscription.nextBillingDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              {subscription.status === 'ACTIVE' && (
                <button
                  onClick={() => handleCancel(subscription)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Cancel Plan
                </button>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Plan Features</h3>
              <ul className="mt-2 space-y-2">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-500">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Available Plans */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Plan */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Health Plan</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              £19.99
              <span className="text-sm font-normal text-gray-500">/monthly</span>
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                2 blood tests per year
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Standard booking
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Basic health tracking
              </li>
            </ul>
            <button
              onClick={() => {}}
              className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Subscribe to Basic Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white shadow-sm rounded-lg border-2 border-teal-500 p-6 relative">
            <div className="absolute top-0 right-0 -translate-y-1/2 px-3 py-1 bg-teal-500 text-white text-sm font-medium rounded-full">
              Popular
            </div>
            <h3 className="text-lg font-medium text-gray-900">Premium Health Plan</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              £29.99
              <span className="text-sm font-normal text-gray-500">/monthly</span>
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Unlimited blood tests
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Priority booking
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Free travel letters
              </li>
              <li className="flex items-center text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                24/7 GP access
              </li>
            </ul>
            <button
              onClick={() => {}}
              className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Subscribe to Premium Plan
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to cancel your subscription? You'll lose access to all premium features at the end of your current billing period.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
