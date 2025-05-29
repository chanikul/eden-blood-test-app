import { HomePage } from '@/components/HomePage';
import { getActiveBloodTests, type BloodTest } from '@/lib/services/blood-test';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  try {
    console.log('Fetching active blood tests in Home component...');
    const tests = await getActiveBloodTests();
    console.log('Blood tests fetched in Home component:', tests);
    
    return <HomePage tests={tests} />;
  } catch (error) {
    console.error('Error in Home component:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Unable to Load Blood Tests</h1>
          <p className="text-gray-600 mb-8">We're experiencing technical difficulties. Please try again later or contact our support team.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
            <a
              href="mailto:support@edenclinic.co.uk"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-base font-medium rounded-md text-blue-600 hover:bg-blue-50"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }
}
