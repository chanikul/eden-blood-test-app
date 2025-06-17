import { createDirectAdminClient } from '../storage';

/**
 * MCP tool for listing and verifying test results across different patient-facing services
 * This tool abstracts the storage logic and provides a consistent interface
 */
export const listResultsTool = {
  name: 'listResultsTool',
  description: 'Lists and verifies test results for a patient',
  
  /**
   * Lists all test results for a patient
   * @param patientId Patient ID to list results for
   * @param serviceType Type of service (e.g., 'blood-test', 'trt', 'weight-management')
   * @returns Array of file information objects
   */
  async execute({
    patientId,
    serviceType = 'blood-test'
  }: {
    patientId: string;
    serviceType?: string;
  }) {
    try {
      if (!patientId) {
        return {
          success: false,
          error: 'No patient ID provided',
          errorCode: 'PATIENT_ID_MISSING',
          results: []
        };
      }
      
      console.log(`MCP listResultsTool: Listing files for patient ${patientId} in service ${serviceType}`);
      
      // Create a standardized path format for consistent access across services
      // Format: {serviceType}/{patientId}/
      const prefix = `${serviceType}/${patientId}/`;
      
      // Create a fresh direct admin client for this operation
      const directClient = createDirectAdminClient();
      
      // List all files for this patient in the specified service
      const { data, error } = await directClient
        .storage
        .from('test-results')
        .list(prefix);
      
      if (error) {
        console.error('MCP listResultsTool: Error listing files:', error);
        return {
          success: false,
          error: `Error listing files: ${error.message}`,
          errorCode: 'LIST_FAILED',
          results: []
        };
      }
      
      if (!data || data.length === 0) {
        return {
          success: true,
          results: [],
          message: 'No results found for this patient'
        };
      }
      
      // Process the results to include URLs and additional metadata
      const results = await Promise.all(data.map(async (item: { name: string; metadata?: any }) => {
        // Get the public URL for each file
        const { data: urlData } = await directClient
          .storage
          .from('test-results')
          .getPublicUrl(prefix + item.name);
        
        // Create a presigned URL for secure access (expires in 1 hour)
        const { data: signedData, error: signedError } = await directClient
          .storage
          .from('test-results')
          .createSignedUrl(prefix + item.name, 3600);
        
        if (signedError) {
          console.error('MCP listResultsTool: Error creating signed URL:', signedError);
        }
        
        return {
          name: item.name,
          path: prefix + item.name,
          publicUrl: urlData?.publicUrl || null,
          secureUrl: signedData?.signedUrl || null,
          size: item.metadata?.size || 0,
          createdAt: item.metadata?.createdAt || null,
          lastModified: item.metadata?.lastModified || null,
          contentType: item.metadata?.mimetype || null,
          serviceType,
          patientId
        };
      }));
      
      return {
        success: true,
        results,
        count: results.length
      };
    } catch (error) {
      console.error('MCP listResultsTool: Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while listing results',
        errorCode: 'UNEXPECTED_ERROR',
        results: []
      };
    }
  },
  
  /**
   * Verifies if a specific file exists for a patient
   * @param patientId Patient ID to check
   * @param fileName File name to verify
   * @param serviceType Type of service
   * @returns Boolean indicating if the file exists and file information
   */
  async verifyFile({
    patientId,
    fileName,
    serviceType = 'blood-test'
  }: {
    patientId: string;
    fileName: string;
    serviceType?: string;
  }) {
    try {
      if (!patientId || !fileName) {
        return {
          success: false,
          error: 'Patient ID and file name are required',
          exists: false
        };
      }
      
      // Create a standardized path format
      const filePath = `${serviceType}/${patientId}/${fileName}`;
      
      // Create a fresh direct admin client for this operation
      const directClient = createDirectAdminClient();
      
      // Check if the file exists
      const { data, error } = await directClient
        .storage
        .from('test-results')
        .download(filePath);
      
      if (error) {
        // If the error is a 404, the file doesn't exist
        if (error.message.includes('404') || error.message.includes('not found')) {
          return {
            success: true,
            exists: false,
            message: 'File does not exist'
          };
        }
        
        // Other errors
        return {
          success: false,
          error: `Error verifying file: ${error.message}`,
          exists: false
        };
      }
      
      // File exists, get its URL
      const { data: urlData } = await directClient
        .storage
        .from('test-results')
        .getPublicUrl(filePath);
      
      return {
        success: true,
        exists: true,
        url: urlData?.publicUrl || null,
        path: filePath,
        serviceType,
        patientId
      };
    } catch (error) {
      console.error('MCP listResultsTool: Error verifying file:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while verifying file',
        exists: false
      };
    }
  }
};
