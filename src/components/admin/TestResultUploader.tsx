import { useState, useEffect } from 'react';
// import { Input } from '../ui/input'; // Temporarily removed for deployment
// import { Select } from '../ui/select'; // Temporarily removed for deployment
import { Loader2, Upload, CheckCircle, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { createPresignedUrl } from '../../lib/storage';
import { StorageMcpClient } from '../../lib/mcp/storage-mcp-client';
import { toast } from 'sonner';
import { TestStatus } from '@prisma/client';
// import { Alert, AlertDescription } from '../ui/alert'; // Temporarily removed for deployment
import { cn } from '../../lib/utils';

// Using TestStatus from Prisma client import

interface TestResultUploaderProps {
  orderId: string;
  bloodTestId: string;
  clientId: string;
  testName: string;
  existingResultId?: string;
  onSuccess?: () => void;
}

export function TestResultUploader({
  orderId,
  bloodTestId,
  clientId,
  testName,
  existingResultId,
  onSuccess
}: TestResultUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<TestStatus>(TestStatus.processing);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accept multiple file types: PDF, PNG, JPG, DOCX
      const acceptedTypes = [
        'application/pdf',                                         // PDF
        'image/png',                                              // PNG
        'image/jpeg',                                             // JPG/JPEG
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
      ];
      
      if (!acceptedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, PNG, JPG, or DOCX file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  // Fetch existing file info if we have an existingResultId
  useEffect(() => {
    if (existingResultId) {
      const fetchExistingResult = async () => {
        try {
          const response = await fetch(`/api/test-results/${existingResultId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.resultUrl) {
              setUploadedFileUrl(data.resultUrl);
              // Extract filename from URL or path
              const fileName = data.resultUrl.split('/').pop() || `${orderId}.pdf`;
              setExistingFileName(fileName);
              
              // Generate a preview URL
              try {
                const previewUrl = await createPresignedUrl(data.resultUrl, '3600');
                setPreviewUrl(previewUrl);
              } catch (error) {
                console.error('Error generating preview URL:', error);
              }
            }
            if (data.status) {
              setStatus(data.status);
            }
          }
        } catch (error) {
          console.error('Error fetching existing test result:', error);
        }
      };
      
      fetchExistingResult();
    }
  }, [existingResultId, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && status !== TestStatus.processing && !uploadedFileUrl) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      // If we have a file, upload it first
      let resultUrl = null;
      if (file) {
        try {
          // Determine file extension based on file type
          let fileExtension = 'pdf'; // Default
          if (file.type === 'image/png') fileExtension = 'png';
          else if (file.type === 'image/jpeg') fileExtension = 'jpg';
          else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileExtension = 'docx';
          
          const sanitizedFileName = `${orderId}.${fileExtension}`;
          
          console.log(`Preparing to upload file for client ${clientId}, order ${orderId}`);
          
          // Use the MCP client to upload the file
          // This abstracts the storage logic and provides a consistent interface
          const uploadResult = await StorageMcpClient.uploadFile(
            file,
            sanitizedFileName,
            clientId,
            'blood-test', // Service type
            { orderId, bloodTestId } // Additional metadata
          );
          
          if (!uploadResult.success) {
            throw new Error(`Failed to upload file: ${uploadResult.error}`);
          }
          
          resultUrl = uploadResult.url;
          
          if (!resultUrl) {
            throw new Error('File upload completed but no URL was returned');
          }
          
          console.log(`File uploaded successfully, URL: ${resultUrl}`);
          
          // Store the uploaded file URL and generate a preview URL
          setUploadedFileUrl(resultUrl);
          try {
            const previewUrl = await createPresignedUrl(resultUrl, '3600');
            setPreviewUrl(previewUrl);
          } catch (previewError) {
            console.error('Error generating preview URL:', previewError);
            // Don't fail the upload if preview generation fails
          }
        } catch (uploadError) {
          console.error('Error uploading test result file:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      
      // Create or update the test result
      const endpoint = existingResultId 
        ? `/api/test-results/${existingResultId}`
        : '/api/test-results';
      
      const method = existingResultId ? 'PATCH' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          bloodTestId,
          clientId,
          status,
          ...(resultUrl && { resultUrl }),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save test result');
      }
      
      setUploadSuccess(true);
      
      // Show appropriate toast message based on status
      if (status === TestStatus.ready) {
        toast.success('Test result saved and notification email sent to client');
      } else {
        toast.success('Test result saved successfully');
      }
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Detailed error logging
      console.error('Error uploading test result:', error);
      console.error('Error type:', Object.prototype.toString.call(error));
      console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Provide more specific error messages based on the error type
        if (error.message.includes('Failed to upload file')) {
          setError(`Storage error: ${error.message}`);
        } else if (error.message.includes('Failed to save test result')) {
          setError('API error: Could not save the test result to the database');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract useful information from non-Error objects
        const errorMsg = (error as any).message || (error as any).error || JSON.stringify(error);
        setError(`Unknown error object: ${errorMsg}`);
      } else {
        setError('An unknown error occurred while uploading the test result');
      }
      
      // Show error toast for better visibility
      toast.error('Test result upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Test Result for {testName}</h3>
        <p className="text-sm text-gray-500">Upload test results and set status</p>
        
        {/* Display existing or newly uploaded file */}
        {(uploadedFileUrl || existingFileName) && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium">
                {existingFileName || uploadedFileUrl?.split('/').pop() || `${orderId}.pdf`}
              </span>
              {previewUrl && (
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  Preview <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Result Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as TestStatus)}
            disabled={isUploading}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={TestStatus.processing}>Processing</option>
            <option value={TestStatus.ready}>Ready</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Result File (PDF, PNG, JPG, or DOCX - required for Ready status)
          </label>
          <input
            id="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {file && (
            <p className="text-sm text-gray-500">Selected: {file.name}</p>
          )}
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-md border border-blue-200 flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
            <div>
              When marked as Ready, an email notification (without attachment) will be sent to the client
              with instructions to view results securely in their dashboard.
            </div>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isUploading || uploadSuccess || (status === TestStatus.ready && !file && !existingResultId)}
            className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading || uploadSuccess ? 'bg-teal-500' : 'bg-teal-600 hover:bg-teal-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {existingResultId ? 'Update Result' : 'Upload Result'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
