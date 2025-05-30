'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { CardIcon } from '../../../components/payment/CardIcon';
import { AddPaymentMethodModal } from '../../../components/payment/AddPaymentMethodModal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
    } catch (error) {
      toast.error('Failed to load payment methods');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleDelete = async (method: PaymentMethod) => {
    if (method.isDefault) return;
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedMethod) return;
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: selectedMethod.id }),
      });

      if (!response.ok) throw new Error('Failed to remove payment method');
      
      setPaymentMethods(methods => 
        methods.filter(m => m.id !== selectedMethod.id)
      );
      setShowDeleteModal(false);
      setSelectedMethod(null);
      toast.success('Payment method removed successfully');
    } catch (error) {
      toast.error('Failed to remove payment method');
      console.error(error);
    }
  };

  const setAsDefault = async (methodId: string) => {
    try {
      const response = await fetch('/api/payment-methods/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: methodId }),
      });

      if (!response.ok) throw new Error('Failed to set default payment method');

      setPaymentMethods(methods =>
        methods.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );
      toast.success('Default payment method updated');
    } catch (error) {
      toast.error('Failed to update default payment method');
      console.error(error);
    }
  };

  const getCardIcon = (brand: string) => {
    return <CardIcon brand={brand} />;
  };

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const isExpired = (month: number, year: number) => {
    const now = new Date();
    const expiry = new Date(year, month);
    return now > expiry;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#203749]" />
        </div>
      ) : (
        <div>
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Payment Methods</h1>
              <p className="mt-2 text-sm text-gray-600">
                Add and manage your payment methods
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Elements stripe={stripePromise}>
                <AddPaymentMethodModal onSuccess={fetchPaymentMethods} />
              </Elements>
            </div>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No payment methods
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a payment method to get started
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    {getCardIcon(method.brand)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}
                        <span className="mx-1">•••• {method.last4}</span>
                        {method.isDefault && (
                          <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {formatExpiry(method.expMonth, method.expYear)}
                        {isExpired(method.expMonth, method.expYear) && (
                          <span className="ml-2 text-xs text-red-600">
                            Expired
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => setAsDefault(method.id)}
                        className="p-1 text-gray-400 hover:text-[#203749] transition-colors"
                        title="Set as default"
                      >
                        <Star className="h-5 w-5" />
                      </button>
                    )}
                    {method.isDefault && (
                      <Star className="h-5 w-5 text-[#203749] fill-current" />
                    )}
                    <button
                      onClick={() => handleDelete(method)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={method.isDefault}
                      title={method.isDefault ? 'Cannot delete default payment method' : 'Delete payment method'}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Remove Payment Method</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to remove this payment method? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
