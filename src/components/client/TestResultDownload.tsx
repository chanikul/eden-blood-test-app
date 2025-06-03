import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TestStatus } from '@prisma/client';
import { Download, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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
  
  const testName = result.bloodTest?.name || result.order?.testName || 'Blood Test';
  const isReady = result.status === TestStatus.ready;
  const createdDate = result.order?.createdAt || result.createdAt;
  const updatedDate = result.updatedAt;
  
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
          <Badge
            variant={isReady ? "success" : "secondary"}
            className="capitalize"
          >
            {result.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          {isReady ? (
            <p>Your test results are ready to download.</p>
          ) : (
            <p>Your test results are still being processed. We'll notify you when they're ready.</p>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDownload}
          disabled={!isReady || isLoading}
          className="w-full"
          variant={isReady ? "default" : "outline"}
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
      </CardFooter>
    </Card>
  );
}
