import { useState } from 'react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../lib/storage';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';

// Define TestStatus enum locally to match the Prisma schema
enum TestStatus {
  processing = 'processing',
  ready = 'ready'
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Only accept PDF files
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && status !== TestStatus.processing) {
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
          // Create a secure file path with client ID as the folder name
          // This structure supports Row Level Security policies in Supabase Storage
          // Format: test-results/{clientId}/{orderId}.pdf
          const sanitizedFileName = `${orderId}.pdf`;
          const filePath = `${clientId}/${sanitizedFileName}`;
          
          console.log(`Preparing to upload file for client ${clientId}, order ${orderId}`);
          
          // Upload the file to storage
          resultUrl = await uploadFile(file, filePath);
          
          if (!resultUrl) {
            throw new Error('File upload completed but no URL was returned');
          }
          
          console.log(`File uploaded successfully, URL: ${resultUrl}`);
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
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Result Status
          </label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TestStatus)}
            disabled={isUploading}
          >
            <option value={TestStatus.processing}>Processing</option>
            <option value={TestStatus.ready}>Ready</option>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Result PDF (required for Ready status)
          </label>
          <Input
            id="file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-gray-500">Selected: {file.name}</p>
          )}
          <Alert variant="info" className="bg-blue-50 text-blue-800 text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              When marked as Ready, an email notification (without attachment) will be sent to the client
              with instructions to view results securely in their dashboard.
            </AlertDescription>
          </Alert>
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
