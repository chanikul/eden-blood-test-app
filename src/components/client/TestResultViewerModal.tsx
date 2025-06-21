import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Download, FileText, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestResultViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testName: string;
}

export function TestResultViewerModal({
  isOpen,
  onClose,
  testId,
  testName,
}: TestResultViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && testId) {
      fetchPdfUrl();
    }
    
    return () => {
      // Clean up URL when modal closes
      setPdfUrl(null);
    };
  }, [isOpen, testId]);

  const fetchPdfUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Development mode: Fetching test result', testId);
      
      // Add a development mode flag to bypass authentication in development
      const response = await fetch(`/api/test-results/${testId}/download/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Mode': process.env.NODE_ENV === 'development' ? 'true' : 'false'
        },
      });
      
      if (!response.ok) {
        console.error('Failed to get test result', response.status, response.statusText);
        throw new Error(`Failed to get test result: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Test result data received:', { hasDownloadUrl: !!data.downloadUrl });
      setPdfUrl(data.downloadUrl);
    } catch (err) {
      console.error('Error fetching test result:', err);
      setError('Failed to load test result. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      // Open in a new tab which will trigger download
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{testName} Result</DialogTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-500" />
                <p className="text-gray-500">Loading test result...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="secondary" size="sm" onClick={fetchPdfUrl}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <div className="bg-gray-100 p-2 mb-2 rounded flex justify-center">
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  className="mx-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="mx-2"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
              </div>
              
              <div className="flex-1 bg-white rounded border border-gray-200">
                <embed 
                  src={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[450px]"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center text-gray-500">
                <p>No test result available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
