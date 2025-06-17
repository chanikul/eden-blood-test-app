import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StorageMcpClient } from '../../lib/mcp/storage-mcp-client';

// Define the context type
interface TestResultMcpContextType {
  isLoading: boolean;
  hasResults: boolean;
  results: any[];
  error: string | null;
  verifyFile: (fileName: string) => Promise<any>;
  refreshResults: () => Promise<void>;
}

// Create the context with default values
const TestResultMcpContext = createContext<TestResultMcpContextType>({
  isLoading: true,
  hasResults: false,
  results: [],
  error: null,
  verifyFile: async () => ({ exists: false }),
  refreshResults: async () => {}
});

// Hook to use the context
export const useTestResultMcp = () => useContext(TestResultMcpContext);

interface TestResultMcpProviderProps {
  children: ReactNode;
  patientId: string;
  serviceType?: string;
}

/**
 * Provider component that wraps the application to provide test result data
 * This component uses the MCP client to fetch test results
 */
export function TestResultMcpProvider({
  children,
  patientId,
  serviceType = 'blood-test'
}: TestResultMcpProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch test results
  const fetchResults = async () => {
    if (!patientId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await StorageMcpClient.listResults(patientId, serviceType);
      
      if (response.success) {
        setResults(response.results || []);
        setHasResults((response.results || []).length > 0);
      } else {
        console.error('Error fetching test results:', response.error);
        setError(response.error || 'Failed to fetch test results');
        setResults([]);
        setHasResults(false);
      }
    } catch (err) {
      console.error('Error in TestResultMcpProvider:', err);
      setError('An unexpected error occurred while fetching test results');
      setResults([]);
      setHasResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify if a specific file exists
  const verifyFile = async (fileName: string) => {
    if (!patientId || !fileName) {
      return { exists: false };
    }

    try {
      return await StorageMcpClient.verifyFile(patientId, fileName, serviceType);
    } catch (err) {
      console.error('Error verifying file:', err);
      return { exists: false, error: 'Failed to verify file' };
    }
  };

  // Fetch results on mount and when patientId changes
  useEffect(() => {
    fetchResults();
  }, [patientId, serviceType]);

  // Context value
  const value = {
    isLoading,
    hasResults,
    results,
    error,
    verifyFile,
    refreshResults: fetchResults
  };

  return (
    <TestResultMcpContext.Provider value={value}>
      {children}
    </TestResultMcpContext.Provider>
  );
}
