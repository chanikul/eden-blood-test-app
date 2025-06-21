import { getSupabaseClient, getSupabaseAdminClient } from './supabase-client';
import { createClient } from '@supabase/supabase-js';

// Direct Supabase client for file uploads
// This avoids issues with the singleton pattern in browser environments
// Use environment variables with fallbacks for development only
// IMPORTANT: These fallbacks should be removed in production
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase environment variables');
}

// Create a direct admin client for storage operations
// Export this function so it can be used by the MCP tools
export const createDirectAdminClient = () => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// We'll use the singleton pattern from supabase-client.ts to prevent multiple instances
// For file uploads, we'll always use the admin client to bypass RLS policies

/**
 * Creates a presigned URL for a file in storage
 * @param filePath Path to the file in storage
 * @param expiresIn Expiration time in seconds (default: 60)
 * @returns Presigned URL string
 */
export async function createPresignedUrl(filePath: string, bucketName = 'test-results', expiresIn = 60): Promise<string> {
  try {
    if (!filePath) {
      throw new Error('No file path provided for creating presigned URL');
    }
    
    // Initialize variables
    let bucket = bucketName;
    let path = filePath;
    
    console.log('Creating presigned URL for:', filePath);
    
    // If filePath is a full URL, extract the path
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      console.log('URL path parts:', pathParts);
      
      // Handle Supabase storage URL format: /storage/v1/object/public/bucket-name/path/to/file
      if (pathParts.length >= 4 && pathParts[0] === 'storage' && pathParts[1] === 'v1' && pathParts[2] === 'object') {
        // The bucket name is after 'public' in the path
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex !== -1 && pathParts.length > publicIndex + 1) {
          bucket = pathParts[publicIndex + 1];
          path = pathParts.slice(publicIndex + 2).join('/');
        }
      } else if (pathParts.length > 0) {
        // Fallback to original logic
        bucket = pathParts[0];
        path = pathParts.slice(1).join('/');
      }
    } else if (filePath.includes('/')) {
      // If filePath contains slashes but is not a full URL
      // Format could be: 'bucket/path/to/file.pdf' or just 'path/to/file.pdf'
      const parts = filePath.split('/');
      
      // Only use the first part as bucket if it's not already the default bucket
      // and the path has multiple segments
      if (parts.length > 1) {
        // Always use test-results as the bucket unless explicitly specified otherwise
        if (parts[0] !== 'test-results' && parts[0].indexOf('.') === -1) {
          bucket = parts[0];
          path = parts.slice(1).join('/');
        }
      }
    }
    
    console.log(`Parsed storage path - Bucket: ${bucket}, Path: ${path}`);
    
    // Create a fresh direct admin client for this operation
    const directClient = createDirectAdminClient();
    
    // Generate a signed URL using the direct admin client to bypass RLS
    const { data, error } = await directClient
      .storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Error creating signed URL: ${error.message}`);
    }
    
    if (!data?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }
    
    console.log(`Successfully generated signed URL for ${bucket}/${path}`);
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
    // Validate inputs before attempting upload
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    if (!path) {
      throw new Error('No storage path specified for upload');
    }
    
    console.log(`Attempting to upload file to ${bucket}/${path}`);
    
    // Create a fresh direct admin client for this upload operation
    // This avoids issues with stale tokens or browser context problems
    const directClient = createDirectAdminClient();
    
    // Use the direct admin client for uploads to bypass RLS policies
    const { data, error } = await directClient
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing files
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Error uploading file: ${error.message}`);
    }
    
    if (!data?.path) {
      throw new Error('Upload succeeded but no file path was returned');
    }
    
    // Get the public URL for the uploaded file using the same direct client
    // This ensures we use the same authentication context for both operations
    const { data: urlData } = await directClient
      .storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded file');
    }
    
    return urlData.publicUrl;
  } catch (error) {
    // Provide more detailed error logging
    console.error('Error in uploadFile:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Deletes a file from storage
 * @param filePath Path to the file to delete
 * @param bucket Storage bucket name (default: 'test-results')
 */
export async function deleteFile(filePath: string, bucket = 'test-results'): Promise<void> {
  try {
    // Extract path from URL if needed
    let path = filePath;
    
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // Remove bucket from path if it's included
      if (pathParts.length > 0 && pathParts[0] === bucket) {
        path = pathParts.slice(1).join('/');
      } else {
        path = pathParts.join('/');
      }
    }
    
    // Create a fresh direct admin client for this operation
    const directClient = createDirectAdminClient();
    
    // Use direct admin client to bypass RLS policies
    const { error } = await directClient
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
 * @param prefix Prefix to filter files
 * @param bucket Storage bucket name (default: 'test-results')
 * @returns Array of file paths
 */
export async function listFiles(prefix: string, bucket = 'test-results'): Promise<string[]> {
  try {
    // Create a fresh direct admin client for this operation
    const directClient = createDirectAdminClient();
    
    const { data, error } = await directClient
      .storage
      .from(bucket)
      .list(prefix);
    
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
