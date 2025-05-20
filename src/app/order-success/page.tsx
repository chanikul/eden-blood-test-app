import { CheckCircle } from 'lucide-react';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; sessionId?: string };
}) {
  const orderId = searchParams.orderId;
  const sessionId = searchParams.sessionId;

  if (!orderId || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl">
            <p>Missing order information</p>
          </div>
        </div>
      </div>
    );
  }

  let error = '';
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/verify-payment?orderId=${orderId}&sessionId=${sessionId}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to verify payment');
    }

    // If we get here, the payment was verified successfully
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl w-full mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Successful!</h1>
            <p className="mt-4 text-lg text-gray-600">
              Thank you for your order. We have sent a confirmation email with further instructions.
            </p>
            <p className="mt-2 text-gray-500">Order ID: {orderId}</p>
            <div className="mt-8 space-y-4">
              <p className="text-gray-600">
                What happens next:
              </p>
              <ol className="list-decimal text-left ml-8 space-y-2 text-gray-600">
                <li>You will receive an email with your order confirmation and instructions</li>
                <li>Our team will prepare your blood test kit</li>
                <li>The kit will be dispatched to your address</li>
                <li>Follow the instructions in the kit to collect your sample</li>
              </ol>
            </div>
            <div className="mt-8">
              <a
                href="/"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to verify payment';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl">
            <p>There was an error verifying your order:</p>
            <p className="font-semibold mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }
}
