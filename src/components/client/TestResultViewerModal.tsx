import { useState, useEffect } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'; // Temporarily removed for deployment
// import { Button } from '../ui/button'; // Temporarily removed for deployment
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
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-[900px] w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="mb-4 flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">{testName} Result</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        
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
                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm" onClick={fetchPdfUrl}>
                  Try Again
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <div className="bg-gray-100 p-2 mb-2 rounded flex justify-center">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mx-2 flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </button>
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mx-2 flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Open in New Tab
                </button>
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
        </div>
      </div>
    ) : null
  );
}
