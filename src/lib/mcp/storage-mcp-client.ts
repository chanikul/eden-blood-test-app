import { uploadTool, listResultsTool } from './storage-mcp-server';

/**
 * Client for interacting with the storage MCP server
 * This provides a simplified interface for the application to use the MCP tools
 */
export class StorageMcpClient {
  /**
   * Upload a file to storage
   * @param file File to upload (base64 encoded string)
   * @param fileName Name of the file
   * @param patientId Patient ID for organizing files
   * @param serviceType Type of service (e.g., 'blood-test', 'trt', 'weight-management')
   * @param metadata Additional metadata for the file
   * @returns Result of the upload operation
   */
  static async uploadFile(
    file: File,
    fileName: string,
    patientId: string,
    serviceType = 'blood-test',
    metadata = {}
  ) {
    try {
      // Convert File object to base64 string
      const base64 = await this.fileToBase64(file);
      
      // Call the MCP tool
      const result = await uploadTool.execute({
        file: base64,
        fileName,
        patientId,
        serviceType,
        metadata
      });
      
      return result;
    } catch (error) {
      console.error('StorageMcpClient.uploadFile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file upload',
        errorCode: 'CLIENT_ERROR'
      };
    }
  }
  
  /**
   * List all test results for a patient
   * @param patientId Patient ID to list results for
   * @param serviceType Type of service
   * @returns Array of file information objects
   */
  static async listResults(patientId: string, serviceType = 'blood-test') {
    try {
      // Call the MCP tool
      const result = await listResultsTool.execute({
        patientId,
        serviceType
      });
      
      return result;
    } catch (error) {
      console.error('StorageMcpClient.listResults error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while listing results',
        errorCode: 'CLIENT_ERROR',
        results: []
      };
    }
  }
  
  /**
   * Verify if a specific file exists for a patient
   * @param patientId Patient ID to check
   * @param fileName File name to verify
   * @param serviceType Type of service
   * @returns Boolean indicating if the file exists and file information
   */
  static async verifyFile(patientId: string, fileName: string, serviceType = 'blood-test') {
    try {
      // Call the MCP tool
      const result = await listResultsTool.verifyFile({
        patientId,
        fileName,
        serviceType
      });
      
      return result;
    } catch (error) {
      console.error('StorageMcpClient.verifyFile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while verifying file',
        exists: false
      };
    }
  }
  
  /**
   * Convert a File object to a base64 string
   * @param file File to convert
   * @returns Base64 encoded string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  
  /**
   * Get a download URL for a specific file
   * @param patientId Patient ID
   * @param fileName File name to download
   * @param serviceType Type of service
   * @returns Download URL for the file
   */
  static async getDownloadUrl(patientId: string, fileName: string, serviceType = 'blood-test') {
    try {
      // Import the createPresignedUrl function directly
      // Using direct import to avoid dynamic import issues in production
      const { createPresignedUrl } = require('../storage');
      
      // Construct the file path
      const filePath = `${patientId}/${serviceType}/${fileName}`;
      
      // Generate a presigned URL for secure download
      const downloadUrl = await createPresignedUrl(filePath, 'test-results');
      
      return downloadUrl;
    } catch (error) {
      console.error('StorageMcpClient.getDownloadUrl error:', error);
      return null;
    }
  }
}
