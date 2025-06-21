import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // In development mode, bypass authentication
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Bypassing authentication for upload-file API');
    } else {
      // Verify admin authentication in production
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const admin = await verifySessionToken(token);
      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Get the form data with the file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const testResultId = formData.get('testResultId') as string;
    
    // Validate required fields
    if (!file || !path || !testResultId) {
      return NextResponse.json(
        { error: 'file, path, and testResultId are required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key for admin operations
    // Make sure we're using the service role key to bypass RLS policies
    console.log('Initializing Supabase client with service role key');
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    // Generate a unique file name to avoid collisions
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullPath = `${path}/${testResultId}/${uniqueFileName}`;
    
    console.log('Uploading file to path:', fullPath);
    
    // Convert the file to an array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Upload the file directly using the service role key (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('test-results')
      .upload(fullPath, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      
      // If it's an RLS error, it means the service role key isn't being used correctly
      if (error.message?.includes('new row violates row-level security policy')) {
        console.error('RLS policy violation detected. This suggests the service role key is not being applied correctly.');
      }
      
      return NextResponse.json(
        { error: 'Failed to upload file', details: error },
        { status: 500 }
      );
    }
    
    // Construct the public URL for the uploaded file
    // Use the Supabase public URL format to ensure the file is accessible
    // We need to properly encode each path segment separately to ensure the URL works correctly
    const pathSegments = fullPath.split('/').map(segment => encodeURIComponent(segment));
    const encodedPath = pathSegments.join('/');
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/test-results/${encodedPath}`;
    
    // Return success with the file URL
    return NextResponse.json({
      success: true,
      fileUrl,
      path: fullPath,
      bucket: 'test-results',
    });
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error },
      { status: 500 }
    );
  }
}
