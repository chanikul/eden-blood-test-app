import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlzfhnnwyvddaoikrung.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear our custom JWT token
    cookieStore.delete('eden_admin_token');
    
    // Clear all Supabase cookies
    const supabaseCookies = cookieStore.getAll();
    for (const cookie of supabaseCookies) {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    }
    
    // If we have access to the Supabase client, also sign out there
    if (supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // This is a server-side logout, which won't affect the client session
        // But it's good to have for completeness
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.error('Supabase logout error:', supabaseError);
        // Continue with the response even if Supabase logout fails
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
