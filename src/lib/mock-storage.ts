/**
 * Mock storage implementation for development mode
 * This provides mock implementations of storage functions when Supabase credentials aren't available
 */

// In-memory storage for mock files
const mockStorage: Record<string, Map<string, any>> = {
  'test-results': new Map()
};

/**
 * Mock implementation of file upload
 * @param file File to upload
 * @param path Path where the file should be stored
 * @param bucket Storage bucket name
 * @returns Mocked URL of the uploaded file
 */
export async function mockUploadFile(file: File, path: string, bucket = 'test-results'): Promise<string> {
  console.log(`[MOCK] Uploading file to ${bucket}/${path}`);
  
  // Create bucket if it doesn't exist
  if (!mockStorage[bucket]) {
    mockStorage[bucket] = new Map();
  }
  
  // Store file metadata (we can't actually store the file content in memory)
  mockStorage[bucket].set(path, {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    uploadedAt: new Date().toISOString()
  });
  
  // Return a mock URL
  return `http://localhost:3000/mock-storage/${bucket}/${path}`;
}

/**
 * Mock implementation of presigned URL creation
 * @param filePath The path to the file in storage
 * @param expiresIn Expiry time in seconds
 * @returns Mock presigned URL
 */
export async function mockCreatePresignedUrl(filePath: string, expiresIn = 60): Promise<string> {
  console.log(`[MOCK] Creating presigned URL for ${filePath} (expires in ${expiresIn}s)`);
  
  // Extract bucket and path
  let bucket = 'test-results';
  let path = filePath;
  
  if (filePath.includes('/')) {
    const parts = filePath.split('/');
    bucket = parts[0];
    path = parts.slice(1).join('/');
  }
  
  // Generate a mock signed URL with expiry timestamp
  const expiryTime = Date.now() + (expiresIn * 1000);
  return `http://localhost:3000/mock-storage/${bucket}/${path}?expires=${expiryTime}`;
}

/**
 * Mock implementation of file deletion
 * @param bucket Storage bucket name
 * @param filePath Path to the file to delete
 */
export async function mockDeleteFile(bucket: string, filePath: string): Promise<void> {
  console.log(`[MOCK] Deleting file ${bucket}/${filePath}`);
  
  if (mockStorage[bucket]) {
    mockStorage[bucket].delete(filePath);
  }
}

/**
 * Mock implementation of file listing
 * @param bucket Storage bucket name
 * @returns Array of mock file paths
 */
export async function mockListFiles(bucket: string): Promise<string[]> {
  console.log(`[MOCK] Listing files in ${bucket}`);
  
  if (!mockStorage[bucket]) {
    return [];
  }
  
  return Array.from(mockStorage[bucket].keys());
}
