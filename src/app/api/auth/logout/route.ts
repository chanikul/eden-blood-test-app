import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseClient } from '../../../../lib/supabase-client';

// Using named export for compatibility with Netlify
export const POST = async () => {
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
    
    // Use the Supabase client singleton
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out with Supabase:', error);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
};
