import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TestStatus, OrderStatus } from '@prisma/client';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{testName}</CardTitle>
            <CardDescription>
              Test ordered {formatDistanceToNow(new Date(createdDate), { addSuffix: true })}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={canDownload ? 'primary' : 'outline'}
              className={
                canDownload 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : order.status === OrderStatus.DISPATCHED 
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }
            >
              {canDownload ? 'Results Ready' : order.status === OrderStatus.DISPATCHED ? 'Dispatched' : order.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                  <Alert variant="info" className="mt-2 bg-blue-50 text-blue-800 text-xs p-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription>
                      You'll receive an email when your results are ready to view.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          ) : (
            <>
              <p>Your test is still being processed. We'll notify you when it's dispatched.</p>
              <Alert variant="info" className="mt-2 bg-blue-50 text-blue-800 text-xs p-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription>
                  You'll receive an email when your test is dispatched and when results are ready.
                </AlertDescription>
              </Alert>
            </>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {canDownload && testResult && (
          <Button
            onClick={() => setIsViewerOpen(true)}
            className="w-full"
            variant="secondary"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Results
          </Button>
        )}
        <Button
          onClick={handleDownload}
          disabled={!canDownload || isLoading}
          className="w-full"
          variant={canDownload ? "primary" : "secondary"}
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
        </Button>
        
        {/* Viewer Modal */}
        {canDownload && testResult && (
          <TestResultViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            testId={testResult.id}
            testName={testName}
          />
        )}
      </CardFooter>
    </Card>
  );
}
