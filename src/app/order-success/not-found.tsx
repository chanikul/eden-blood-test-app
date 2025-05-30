export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find the order you&apos;re looking for. This could be because:
        </p>
        <ul className="text-left text-gray-600 mb-6 list-disc list-inside">
          <li>The order ID is incorrect</li>
          <li>The order has been cancelled</li>
          <li>The payment session has expired</li>
        </ul>
        <a
          href="/"
          className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Return to home
        </a>
      </div>
    </div>
  );
}
