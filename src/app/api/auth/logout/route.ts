import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseClient } from '../../../../lib/supabase-client';
import { clearAuthCookie } from '@/lib/auth';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Using named export for compatibility with Netlify
export const POST = async () => {
  try {
    console.log('Logout process started');
    const cookieStore = cookies();
    
    // Use our enhanced clearAuthCookie function to clear all tokens
    clearAuthCookie(true); // Clear patient token
    clearAuthCookie(false); // Clear admin token
    
    // Clear our custom JWT tokens
    cookieStore.delete('eden_admin_token');
    cookieStore.delete('eden_patient_token');
    
    // Clear all Supabase cookies
    const supabaseCookies = cookieStore.getAll();
    console.log('Found cookies to clear:', supabaseCookies.map(c => c.name).join(', '));
    
    // Clear all cookies that match Supabase patterns
    for (const cookie of supabaseCookies) {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        console.log(`Clearing cookie: ${cookie.name}`);
        cookieStore.delete(cookie.name);
      }
    }
    
    // Explicitly clear these known Supabase cookies
    const supabaseCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-provider-token',
      'sb-auth-token'
    ];
    
    // Clear each cookie by name
    for (const cookieName of supabaseCookieNames) {
      cookieStore.delete(cookieName);
    }
    
    // Use the Supabase client singleton
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Supabase signOut error:', error);
      } else {
        console.log('Supabase signOut successful');
      }
    } catch (error) {
      console.error('Error signing out with Supabase:', error);
    }
    
    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
};
