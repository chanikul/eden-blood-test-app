import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { toast } from 'sonner';

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
        // Create a unique file path with timestamp and original name
        const timestamp = new Date().getTime();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${clientId}/${timestamp}-${sanitizedFileName}`;
        
        // Upload the file to storage
        resultUrl = await uploadFile(file, filePath);
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
      toast.success('Test result saved successfully');
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error uploading test result:', err);
      setError('Failed to upload test result. Please try again.');
      toast.error('Failed to save test result');
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
