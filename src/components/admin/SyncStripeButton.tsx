'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';

interface SyncProduct {
  name: string;
  status: 'created' | 'updated' | 'archived';
  oldPrice?: string;
  newPrice: string;
}

interface SyncDetails {
  created: number;
  updated: number;
  archived: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  details: SyncDetails;
  products: SyncProduct[];
}

export function SyncStripeButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);

  const handleSync = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);
      const response = await fetch('/api/admin/sync-stripe', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync with Stripe');
      }

      const data: SyncResponse = await response.json();

      setSyncResult(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync with Stripe');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
          </>
        ) : (
          'Sync with Stripe'
        )}
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-30" />
          </Transition.Child>

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Stripe Sync Results
            </Dialog.Title>

            {syncResult && (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-700">{syncResult.details.created}</div>
                      <div className="text-xs text-green-600">Created</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-700">{syncResult.details.updated}</div>
                      <div className="text-xs text-blue-600">Updated</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-700">{syncResult.details.archived}</div>
                      <div className="text-xs text-gray-600">Archived</div>
                    </div>
                  </div>

                  <div className="border rounded-lg divide-y">
                    {syncResult.products.map((product, index) => (
                      <div key={index} className="p-3 flex items-start space-x-3">
                        <span className="text-xl">
                          {product.status === 'created' ? '✨' : product.status === 'updated' ? '📝' : '📦'}
                        </span>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.status === 'created' && (
                              <>New price: £{product.newPrice}</>
                            )}
                            {product.status === 'updated' && (
                              <>£{product.oldPrice} → £{product.newPrice}</>
                            )}
                            {product.status === 'archived' && (
                              <>Product archived</>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
