import { CheckCircle } from 'lucide-react';

export function RedirectingToPayment() {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-6 max-w-sm mx-auto">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Thanks! Your order has been received.
        </h2>
        <p className="text-gray-600">
          We&apos;ll be in touch shortly.
        </p>
        <div className="mt-4">
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to payment...
          </div>
        </div>
      </div>
    </div>
  );
}
