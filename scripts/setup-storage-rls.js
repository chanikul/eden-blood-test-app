/**
 * This script sets up Supabase Storage Row Level Security (RLS) policies
 * for the test-results bucket to ensure secure access to test result files.
 * 
 * Run this script with: node scripts/setup-storage-rls.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageRLS() {
  console.log('Setting up Supabase Storage RLS policies...');

  try {
    // Create test-results bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    const testResultsBucket = buckets.find(bucket => bucket.name === 'test-results');
    
    if (!testResultsBucket) {
      console.log('Creating test-results bucket...');
      const { error: createBucketError } = await supabase.storage.createBucket('test-results', {
        public: false,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createBucketError) {
        throw new Error(`Failed to create bucket: ${createBucketError.message}`);
      }
      
      console.log('✅ test-results bucket created successfully');
    } else {
      console.log('✅ test-results bucket already exists');
    }

    // Set up RLS policies for the test-results bucket
    
    // 1. Allow admins to read and write any file
    console.log('Setting up admin access policy...');
    await supabase.rpc('create_storage_policy', {
      bucket_id: 'test-results',
      policy_name: 'Admin Access',
      definition: `(role() = 'authenticated' AND auth.jwt() ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'))`,
      operation: 'ALL',
    });
    
    // 2. Allow clients to read only their own files
    console.log('Setting up client read access policy...');
    await supabase.rpc('create_storage_policy', {
      bucket_id: 'test-results',
      policy_name: 'Client Read Access',
      definition: `(
        role() = 'authenticated' AND 
        auth.jwt() ->> 'role' = 'PATIENT' AND 
        (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
      )`,
      operation: 'SELECT',
    });
    
    console.log('✅ RLS policies set up successfully');
    
  } catch (error) {
    console.error('Error setting up RLS policies:', error);
    process.exit(1);
  }
}

setupStorageRLS()
  .then(() => {
    console.log('✅ Storage setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Storage setup failed:', error);
    process.exit(1);
  });
