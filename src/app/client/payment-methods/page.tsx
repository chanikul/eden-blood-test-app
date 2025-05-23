'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Plus,
  CheckCircle2,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      brand: 'mastercard',
      last4: '8888',
      expMonth: 3,
      expYear: 2026,
      isDefault: false,
    },
  ]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleDelete = (method: PaymentMethod) => {
    if (method.isDefault) return;
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedMethod) return;
    // TODO: API call to delete payment method
    setPaymentMethods(methods => 
      methods.filter(m => m.id !== selectedMethod.id)
    );
    setShowDeleteModal(false);
    setSelectedMethod(null);
  };

  const setAsDefault = async (methodId: string) => {
    // TODO: API call to set default payment method
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
  };

  const getCardIcon = (brand: string) => {
    // In a real app, you'd import and use actual card brand SVGs
    return <CreditCard className="h-6 w-6 text-gray-400" />;
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
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your saved payment methods
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => {}}  // TODO: Open Stripe Elements modal
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {paymentMethods.map((method) => (
            <li key={method.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  {getCardIcon(method.brand)}
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          Default
                        </span>
                      )}
                      {isExpired(method.expMonth, method.expYear) && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Expires {formatExpiry(method.expMonth, method.expYear)}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-4">
                  {!method.isDefault && !isExpired(method.expMonth, method.expYear) && (
                    <button
                      onClick={() => setAsDefault(method.id)}
                      className="text-sm text-teal-600 hover:text-teal-800"
                    >
                      Set as default
                    </button>
                  )}
                  {!method.isDefault && (
                    <button
                      onClick={() => handleDelete(method)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

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
