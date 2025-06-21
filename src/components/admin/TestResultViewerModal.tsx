import { useState, useEffect } from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'; // Temporarily removed for deployment
// import { Button } from '../ui/button'; // Temporarily removed for deployment
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
    isOpen ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="mb-4 flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">{testName} Result</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isLoading || !pdfUrl}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            >
              <Download className="h-4 w-4 mr-1 inline" />
              Download
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              <X className="h-4 w-4 m-auto" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
        
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
                <button 
                  onClick={fetchSecureUrl} 
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm mt-4"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <div className="bg-gray-100 p-2 mb-2 rounded flex justify-center">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mx-2"
                >
                  <Download className="h-4 w-4 mr-1 inline" />
                  Download PDF
                </button>
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mx-2"
                >
                  <FileText className="h-4 w-4 mr-1 inline" />
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
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No result available</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    ) : null
  );
}
