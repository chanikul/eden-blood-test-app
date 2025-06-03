import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Creates a presigned URL for secure file access
 * @param filePath The path to the file in storage
 * @param expiresIn Expiry time in seconds (default: 60 seconds)
 * @returns Presigned URL for secure access
 */
export async function createPresignedUrl(filePath: string, expiresIn = 60): Promise<string> {
  try {
    // Extract bucket and path from the filePath
    // Expected format: 'bucket/path/to/file.pdf' or full URL
    let bucket = 'test-results';
    let path = filePath;
    
    // If filePath is a full URL, extract the path
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 0) {
        bucket = pathParts[0];
        path = pathParts.slice(1).join('/');
      }
    } else if (filePath.includes('/')) {
      // If filePath contains slashes, first part might be the bucket
      const parts = filePath.split('/');
      bucket = parts[0];
      path = parts.slice(1).join('/');
    }
    
    // Generate a signed URL
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      throw new Error(`Error creating signed URL: ${error.message}`);
    }
    
    if (!data?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in createPresignedUrl:', error);
    throw error;
  }
}

/**
 * Uploads a file to storage and returns the file URL
 * @param file File to upload
 * @param path Path where the file should be stored
 * @param bucket Storage bucket name (default: 'test-results')
 * @returns URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket = 'test-results'
): Promise<string> {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
    
    if (!data?.path) {
      throw new Error('Failed to upload file');
    }
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

/**
 * Deletes a file from storage
 * @param bucket Storage bucket name
 * @param filePath Path to the file to delete
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  try {
    // Extract path from filePath if it's a full URL
    let path = filePath;
    
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 1) {
        path = pathParts.slice(1).join('/');
      }
    }
    
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw error;
  }
}

/**
 * Lists all files in a storage bucket
 * @param bucket Storage bucket name
 * @returns Array of file paths
 */
export async function listFiles(bucket: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list();
    
    if (error) {
      throw new Error(`Error listing files: ${error.message}`);
    }
    
    if (!data) {
      return [];
    }
    
    // Return only file paths, exclude folders
    return data
      .filter(item => !item.id.endsWith('/'))
      .map(item => item.name);
  } catch (error) {
    console.error('Error in listFiles:', error);
    throw error;
  }
}
