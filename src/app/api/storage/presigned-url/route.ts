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
      console.log('Development mode: Bypassing authentication for presigned-url API');
    } else {
      // Verify admin authentication in production
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const session = await verifySessionToken(token);
      if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Parse request body
    const { fileName, contentType, path } = await request.json();
    
    // Validate required fields
    if (!fileName || !contentType || !path) {
      return NextResponse.json(
        { error: 'fileName, contentType, and path are required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    // Generate a unique file name to avoid collisions
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const fullPath = `${path}/${uniqueFileName}`;
    
    console.log('Creating signed upload URL for path:', fullPath);
    
    // Create a presigned URL for direct upload to Supabase Storage
    // Using service role key bypasses RLS policies
    const { data, error } = await supabase.storage
      .from('test-results')
      .createSignedUploadUrl(fullPath);
    
    if (error) {
      console.error('Error creating presigned URL:', error);
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      );
    }
    
    // Return the presigned URL and any fields needed for the upload
    return NextResponse.json({
      url: data.signedUrl,
      fields: {
        key: fullPath,
        bucket: 'test-results',
      },
    });
  } catch (error) {
    console.error('Error in presigned URL generation:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
