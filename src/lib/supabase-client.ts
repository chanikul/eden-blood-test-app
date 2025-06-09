import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get a singleton instance of the Supabase client
 * This prevents "Multiple GoTrueClient instances detected" warnings
 * and ensures consistent initialization across the app
 */
export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  
  // Use string literals for client-side environment variables with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlzfhnnwyvddaoikrung.supabase.co';
  
  // Use the anonymous key for client-side authentication
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemZobm53eXZkZGFvaWtydW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4ODkwNjgsImV4cCI6MjA2MjQ2NTA2OH0.wsXovBz2DzuZHRLOkoFJC821Tby6BRVXaottKJevAL8';

  // Initialize Supabase client with standard options
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
  
  return supabaseInstance;
}
