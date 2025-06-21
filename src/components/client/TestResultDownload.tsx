import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { TestStatus } from '@prisma/client';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useTestResultMcp } from './TestResultMcpProvider';
import { TestResultViewerModal } from './TestResultViewerModal';

interface TestResultDownloadProps {
  result: {
    id: string;
    status: TestStatus;
    resultUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
    bloodTest?: {
      name: string;
      slug: string;
    };
    order?: {
      createdAt: Date;
      testName: string;
    };
  };
}

export function TestResultDownload({ result }: TestResultDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [lastDownloaded, setLastDownloaded] = useState<Date | null>(null);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Use our MCP provider to verify file existence
  const { verifyFile } = useTestResultMcp();
  
  const testName = result.bloodTest?.name || result.order?.testName || 'Blood Test';
  // Only consider READY status as valid for viewing/downloading results
  // TestStatus only has 'processing' and 'ready' values
  const isReady = result.status === TestStatus.ready;
  const createdDate = result.order?.createdAt || result.createdAt;
  const updatedDate = result.updatedAt;
  
  // Verify file existence when component mounts
  useEffect(() => {
    const checkFileExists = async () => {
      if (isReady && result.resultUrl) {
        try {
          // Extract filename from URL
          const fileName = result.resultUrl.split('/').pop() || `${result.id}.pdf`;
          
          // Use MCP tool to verify file existence
          const verifyResult = await verifyFile(fileName);
          setFileExists(verifyResult.exists);
          
          if (!verifyResult.exists && result.status === TestStatus.ready) {
            console.warn(`File marked as ready but does not exist: ${fileName}`);
          }
        } catch (err) {
          console.error('Error verifying file existence:', err);
          setFileExists(false);
        }
      }
    };
    
    checkFileExists();
  }, [result.id, result.resultUrl, isReady, verifyFile]);
  
  const handleDownload = async () => {
    if (!isReady || !result.resultUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request a secure download URL
      const response = await fetch(`/api/test-results/${result.id}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }
      
      const data = await response.json();
      
      // Track download metrics
      setDownloadCount(prev => prev + 1);
      setLastDownloaded(new Date());
      
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
              variant={isReady ? 'primary' : 'outline'}
              className={isReady ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}
            >
              {isReady ? 'Ready' : 'Processing'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          {isReady ? (
            <>
              {fileExists === false ? (
                <>
                  <p>Your test results are marked as ready but the file could not be found.</p>
                  <Alert variant="destructive" className="mt-2 bg-red-50 text-red-800 text-xs p-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription>
                      Please contact support for assistance with your test results.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <>
                  <p>Your test results are ready to download.</p>
                  {lastDownloaded && (
                    <p className="mt-1 text-xs text-gray-400">
                      Last downloaded: {formatDistanceToNow(lastDownloaded, { addSuffix: true })}
                    </p>
                  )}
                  {downloadCount > 0 && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Downloaded {downloadCount} {downloadCount === 1 ? 'time' : 'times'}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p>Your test results are still being processed. We'll notify you when they're ready.</p>
              <Alert variant="info" className="mt-2 bg-blue-50 text-blue-800 text-xs p-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription>
                  You'll receive an email when your results are ready to view.
                </AlertDescription>
              </Alert>
            </>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {isReady && fileExists !== false && (
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
          disabled={!isReady || isLoading || fileExists === false}
          className="w-full"
          variant={isReady && fileExists !== false ? "primary" : "secondary"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : isReady ? (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Results
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Results Processing
            </>
          )}
        </Button>
        
        {/* Viewer Modal */}
        {isReady && (
          <TestResultViewerModal
            isOpen={isViewerOpen}
            onClose={() => setIsViewerOpen(false)}
            testId={result.id}
            testName={testName}
          />
        )}
      </CardFooter>
    </Card>
  );
}
