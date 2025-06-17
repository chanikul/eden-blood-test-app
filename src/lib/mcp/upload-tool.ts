import { createDirectAdminClient } from '../storage';

/**
 * MCP tool for handling file uploads across different patient-facing services
 * This tool abstracts the storage logic and provides a consistent interface
 */
export const uploadTool = {
  name: 'uploadTool',
  description: 'Uploads a file to storage and returns the file URL',
  
  /**
   * Uploads a file to storage and returns the file URL
   * @param file File to upload (base64 encoded string)
   * @param path Path where the file should be stored
   * @param patientId Patient ID for organizing files
   * @param serviceType Type of service (e.g., 'blood-test', 'trt', 'weight-management')
   * @param metadata Additional metadata for the file
   * @returns URL of the uploaded file and success status
   */
  async execute({
    file,
    fileName,
    patientId,
    serviceType = 'blood-test',
    metadata = {}
  }: {
    file: string; // base64 encoded file
    fileName: string;
    patientId: string;
    serviceType?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      // Validate inputs before attempting upload
      if (!file) {
        return {
          success: false,
          error: 'No file provided for upload',
          errorCode: 'FILE_MISSING'
        };
      }
      
      if (!patientId) {
        return {
          success: false,
          error: 'No patient ID provided',
          errorCode: 'PATIENT_ID_MISSING'
        };
      }
      
      if (!fileName) {
        return {
          success: false,
          error: 'No file name provided',
          errorCode: 'FILENAME_MISSING'
        };
      }
      
      // Determine file extension from fileName
      const fileExtension = fileName.split('.').pop() || 'pdf';
      
      // Create a standardized path format for consistent access across services
      // Format: {serviceType}/{patientId}/{fileName}
      const filePath = `${serviceType}/${patientId}/${fileName}`;
      
      console.log(`MCP uploadTool: Attempting to upload file to ${filePath}`);
      
      // Convert base64 to File object
      const binaryString = atob(file.split(',')[1] || file);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Determine MIME type based on extension
      let mimeType = 'application/pdf'; // Default
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
      else if (fileExtension === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const fileObject = new File([bytes], fileName, { type: mimeType });
      
      // Create a fresh direct admin client for this upload operation
      const directClient = createDirectAdminClient();
      
      // Use the direct admin client for uploads to bypass RLS policies
      const { data, error } = await directClient
        .storage
        .from('test-results') // Using a consistent bucket name
        .upload(filePath, fileObject, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing files
          ...(metadata && { metadata }) // Add metadata if provided
        });
      
      if (error) {
        console.error('MCP uploadTool: Error uploading file:', error);
        return {
          success: false,
          error: `Error uploading file: ${error.message}`,
          errorCode: 'UPLOAD_FAILED'
        };
      }
      
      if (!data?.path) {
        return {
          success: false,
          error: 'Upload succeeded but no file path was returned',
          errorCode: 'PATH_MISSING'
        };
      }
      
      // Get the public URL for the uploaded file using the same direct client
      const { data: urlData } = await directClient
        .storage
        .from('test-results')
        .getPublicUrl(data.path);
      
      if (!urlData?.publicUrl) {
        return {
          success: false,
          error: 'Failed to generate public URL for uploaded file',
          errorCode: 'URL_GENERATION_FAILED'
        };
      }
      
      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        serviceType,
        patientId,
        metadata
      };
    } catch (error) {
      // Provide more detailed error logging
      console.error('MCP uploadTool: Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file upload',
        errorCode: 'UNEXPECTED_ERROR'
      };
    }
  }
};
