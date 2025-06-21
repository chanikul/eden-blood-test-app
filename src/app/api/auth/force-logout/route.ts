import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/lib/supabase-client';
import { clearAuthCookie } from '@/lib/auth';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * Force logout API that aggressively clears all session cookies
 * and invalidates the Supabase session
 */
export async function POST() {
  try {
    console.log('Force logout process started');
    const cookieStore = cookies();
    
    // Get all cookies for logging
    const allCookies = cookieStore.getAll();
    console.log('Force logout - Found cookies:', allCookies.map(c => c.name).join(', '));
    
    // Use our enhanced clearAuthCookie function to clear all tokens
    clearAuthCookie(true); // Clear patient token
    clearAuthCookie(false); // Clear admin token
    
    // Clear our custom JWT tokens directly
    cookieStore.delete('eden_admin_token');
    cookieStore.delete('eden_patient_token');
    
    // Clear all Supabase cookies
    for (const cookie of allCookies) {
      if (
        cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase') ||
        cookie.name.includes('eden') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('token')
      ) {
        console.log(`Force logout - Clearing cookie: ${cookie.name}`);
        cookieStore.delete(cookie.name);
      }
    }
    
    // Explicitly clear these known Supabase cookies
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-provider-token',
      'sb-auth-token',
      'eden_patient_token',
      'eden_admin_token',
      '__session',
      'session'
    ];
    
    for (const cookieName of cookieNames) {
      cookieStore.delete(cookieName);
    }
    
    // Use the Supabase client singleton to sign out
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Force logout - Supabase signOut error:', error);
      } else {
        console.log('Force logout - Supabase signOut successful');
      }
    } catch (error) {
      console.error('Force logout - Error signing out with Supabase:', error);
    }
    
    // Return success with cache control headers
    return NextResponse.json(
      { success: true, message: 'All session data cleared' },
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
    console.error('Force logout error:', error);
    return NextResponse.json(
      { error: 'Failed to force logout' }, 
      { status: 500 }
    );
  }
}
