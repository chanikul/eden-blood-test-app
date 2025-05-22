export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Verifying Payment</h2>
        <p className="text-gray-500">Please wait while we confirm your payment...</p>
      </div>
    </div>
  );
}
