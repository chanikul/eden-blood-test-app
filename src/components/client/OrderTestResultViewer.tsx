import { useState, useEffect } from 'react';
// import { Button } from '../ui/button'; // Temporarily removed for deployment
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'; // Temporarily removed for deployment
import { TestStatus, OrderStatus } from '@prisma/client';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
// import { Alert, AlertDescription } from '../ui/alert'; // Temporarily removed for deployment
// import { Badge } from '../ui/badge'; // Temporarily removed for deployment
import { TestResultViewerModal } from './TestResultViewerModal';

interface OrderTestResultViewerProps {
  order: {
    id: string;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    testName: string;
  };
  testResult?: {
    id: string;
    status: TestStatus;
    resultUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export function OrderTestResultViewer({ order, testResult }: OrderTestResultViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const testName = order.testName || 'Blood Test';
  const createdDate = order.createdAt;
  
  // Order should be either DISPATCHED or READY to view results
  const canViewResults = order.status === OrderStatus.DISPATCHED || order.status === OrderStatus.READY;
  
  // Test result should be READY to download
  const canDownload = canViewResults && testResult && testResult.status === TestStatus.ready && testResult.resultUrl;

  const handleDownload = async () => {
    if (!canDownload || !testResult) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request a secure download URL
      const response = await fetch(`/api/test-results/${testResult.id}/download/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }
      
      const data = await response.json();
      
      // Open the secure download URL in a new tab
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Error downloading test result:', err);
      setError('Failed to download result. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full border rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{testName}</h3>
            <p className="text-sm text-gray-500">
              Test ordered {formatDistanceToNow(new Date(createdDate), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={
                `px-2 py-1 text-xs font-medium rounded-full ${
                canDownload 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : order.status === OrderStatus.DISPATCHED 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`
              }
            >
              {canDownload ? 'Results Ready' : order.status === OrderStatus.DISPATCHED ? 'Dispatched' : order.status}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 border-b">
        <div className="text-sm text-gray-500">
          {canViewResults ? (
            <>
              {canDownload ? (
                <>
                  <p>Your test results are ready to download.</p>
                </>
              ) : (
                <>
                  <p>Your test has been dispatched. Results will be available soon.</p>
                  <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <p>
                      You'll receive an email when your results are ready to view.
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p>Your test is still being processed. We'll notify you when it's dispatched.</p>
              <div className="mt-2 bg-blue-50 text-blue-800 text-xs p-2 rounded flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <p>
                  You'll receive an email when your test is dispatched and when results are ready.
                </p>
              </div>
            </>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
      <div className="p-4 flex flex-col space-y-2">
        {canDownload && testResult && (
          <button
            onClick={() => setIsViewerOpen(true)}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center justify-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Results
          </button>
        )}
        <button
          onClick={handleDownload}
          disabled={!canDownload || isLoading}
          className={`w-full px-4 py-2 rounded flex items-center justify-center ${canDownload ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : canDownload ? (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Results
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {order.status === OrderStatus.DISPATCHED ? 'Results Processing' : 'Test Processing'}
            </>
          )}
        </button>
        
        {/* Viewer Modal */}
        {canDownload && testResult && (
          <TestResultViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            testId={testResult.id}
            testName={testName}
          />
        )}
      </div>
    </div>
  );
}
