import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Download, X, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestResultViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResultId: string | null;
  testName: string;
}

export function TestResultViewerModal({
  isOpen,
  onClose,
  testResultId,
  testName
}: TestResultViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && testResultId) {
      fetchSecureUrl();
    }
    
    return () => {
      // Clean up when modal closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [isOpen, testResultId]);

  const fetchSecureUrl = async () => {
    if (!testResultId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the secure download API to get a presigned URL
      const response = await fetch(`/api/test-results/${testResultId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch test result');
      }
      
      const data = await response.json();
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
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">{testName} Result</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading || !pdfUrl}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden mt-4 bg-gray-50 rounded-md border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600" />
                <p className="mt-2 text-gray-600">Loading test result...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center text-red-500">
                <p>{error}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={fetchSecureUrl} 
                  className="mt-4"
                >
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
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No result available</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
