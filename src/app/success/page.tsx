import { Metadata } from 'next';
import SuccessHandler from './success-handler';

// Define metadata for better SEO
export const metadata: Metadata = {
  title: 'Order Successful | Eden Clinic',
  description: 'Your order has been successfully processed',
  robots: 'noindex' // Don't index success pages
};

// Server component that passes session_id to client component
export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams?.session_id || '';
  
  // If no session_id is provided, show an error message
  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
        <p className="text-gray-500 text-center">Missing session_id parameter. Please return to the checkout page.</p>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <a 
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }
  
  // If session_id exists, render the client component with the session_id
  return <SuccessHandler sessionId={sessionId} />;
}
