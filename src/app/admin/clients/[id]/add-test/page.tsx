'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui'; // Temporarily removed for deployment
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, ArrowLeft, Upload, Calendar } from 'lucide-react';
import Link from 'next/link';

interface BloodTest {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
}

export default function AddBloodTestPage({ params, searchParams }: { params: { id: string }, searchParams?: { testResultId?: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [client, setClient] = useState<ClientUser | null>(null);
  const [bloodTests, setBloodTests] = useState<BloodTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Store existing test result ID if we're updating an existing test
  const [existingTestResultId, setExistingTestResultId] = useState<string | null>(searchParams?.testResultId || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch client details
        const clientResponse = await fetch(`/api/admin/clients/${params.id}`);
        if (!clientResponse.ok) {
          if (clientResponse.status === 404) {
            setError('Client not found');
          } else {
            setError('Failed to load client details');
          }
          return;
        }
        const clientData = await clientResponse.json();
        setClient(clientData);
        
        // Fetch available blood tests
        const testsResponse = await fetch('/api/admin/blood-tests');
        if (!testsResponse.ok) {
          setError('Failed to load blood tests');
          return;
        }
        const testsData = await testsResponse.json();
        const activeTests = testsData.filter((test: BloodTest) => test.isActive);
        setBloodTests(activeTests);
        
        if (activeTests.length > 0) {
          setSelectedTest(activeTests[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResultFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!selectedTest) {
      toast.error('Please select a blood test');
      return;
    }
    
    if (!testDate) {
      toast.error('Please select a test date');
      return;
    }
    
    try {
      setSubmitting(true);
      setUploadProgress(0);
      console.log('Submitting form with data:', { clientId: params.id, bloodTestId: selectedTest, testDate });
      
      let testResultId;
      let orderId;
      
      // Only create a new order if we're not just uploading a file to an existing test
      if (!existingTestResultId) {
        // Step 1: Create the order and test result
        const orderData = {
          clientId: params.id,
          bloodTestId: selectedTest,
          testDate,
          sendEmail: true,
        };
        
        console.log('Sending order data to API:', orderData);
        const orderResponse = await fetch('/api/admin/manual-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        console.log('Order API response status:', orderResponse.status);
        
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          console.error('Order API error:', errorData);
          throw new Error(errorData.error || 'Failed to create blood test order');
        }
        
        const responseData = await orderResponse.json();
        console.log('Order API response data:', responseData);
        
        ({ orderId, testResultId } = responseData);
      } else {
        // If we're updating an existing test result, use that ID
        testResultId = existingTestResultId;
        console.log('Using existing test result ID:', testResultId);
      }
      
      // If there's a file to upload, use the server-side upload endpoint
      if (resultFile) {
        try {
          console.log('File selected for upload:', resultFile.name);
          setUploadProgress(20);
          
          // Create form data for the file upload
          const formData = new FormData();
          formData.append('file', resultFile);
          formData.append('path', 'test-results');
          formData.append('testResultId', testResultId);
          
          setUploadProgress(40);
        
          // Upload the file using our server-side endpoint
          console.log('Uploading file to server-side endpoint');
          const uploadResponse = await fetch('/api/storage/upload-file', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => 'No error details available');
            console.error('Upload response error:', uploadResponse.status, errorText);
            throw new Error(`Failed to upload file: ${uploadResponse.status} ${errorText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log('File upload successful:', uploadResult);
          
          // Get the file URL from the response
          const fileUrl = uploadResult.fileUrl;
          
          if (!fileUrl) {
            throw new Error('File URL not returned from upload endpoint');
          }
          
          setUploadProgress(70);
        
          // Update the test result with the file URL
          console.log('Updating test result with file URL:', fileUrl);
          const updateResponse = await fetch(`/api/test-results/${testResultId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resultUrl: fileUrl,
              status: 'ready',
            }),
          });
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text().catch(() => 'No error details available');
            console.error('Update test result error:', updateResponse.status, errorText);
            throw new Error(`Failed to update test result: ${updateResponse.status} ${errorText}`);
          }
          console.log('Test result updated successfully');
          
          setUploadProgress(100);
        } catch (uploadError: any) {
          console.error('Error during file upload process:', uploadError);
          toast.error(uploadError instanceof Error ? uploadError.message : 'Failed to upload file');
          setSubmitting(false);
          return;
        }
      }
      
      console.log('Blood test added successfully, redirecting to client page');
      toast.success('Blood test added successfully');
      
      // Use setTimeout to ensure the toast is visible before navigation
      setTimeout(() => {
        router.push(`/admin/clients/${params.id}`);
      }, 1000);
    } catch (err) {
      console.error('Error adding blood test:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add blood test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-10 w-10 text-teal-500 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push('/admin/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
          </Button>
        </div>
      </>
    );
  }

return (
  <>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="secondary" onClick={() => router.push(`/admin/clients/${params.id}`)} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {existingTestResultId ? 'Update Blood Test Result' : 'Add Blood Test'}
          </h1>
        </div>
      </div>
        
      {client && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-500">Adding blood test for:</p>
          <p className="text-lg font-medium">{client.name}</p>
          <p className="text-sm text-gray-500">{client.email}</p>
        </div>
      )}
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Blood Test Details</h3>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="bloodTest" className="block text-sm font-medium text-gray-700">
                    Blood Test
                  </label>
                  <select
                    id="bloodTest"
                    name="bloodTest"
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
                    required
                  >
                    {bloodTests.length === 0 ? (
                      <option value="">No blood tests available</option>
                    ) : (
                      bloodTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="testDate" className="block text-sm font-medium text-gray-700">
                    Test Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="testDate"
                      name="testDate"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="resultFile" className="block text-sm font-medium text-gray-700">
                    Result File (optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="resultFile"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="resultFile"
                            name="resultFile"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, Word, or image files up to 10MB
                      </p>
                      {resultFile && (
                        <p className="text-sm text-teal-600">
                          Selected: {resultFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {submitting && uploadProgress > 0 && (
                  <div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                            Uploading
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-teal-600">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
                        <div
                          style={{ width: `${uploadProgress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-300"
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push(`/admin/clients/${params.id}`)}
                    className="mr-3"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting || bloodTests.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Add Blood Test'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
