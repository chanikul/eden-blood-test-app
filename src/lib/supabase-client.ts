import { createClient } from '@supabase/supabase-js';

// Singleton pattern with global object to prevent multiple instances across renders
const globalForSupabase = global as unknown as {
  supabaseInstance: ReturnType<typeof createClient> | undefined;
  supabaseAdminInstance: ReturnType<typeof createClient> | undefined;
};

// Use the actual values from the .env file
// These values are from the .env file we viewed earlier
const SUPABASE_URL = 'https://dlzfhnnwyvddaoikrung.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemZobm53eXZkZGFvaWtydW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4ODkwNjgsImV4cCI6MjA2MjQ2NTA2OH0.wsXovBz2DzuZHRLOkoFJC821Tby6BRVXaottKJevAL8';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemZobm53eXZkZGFvaWtydW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg4OTA2OCwiZXhwIjoyMDYyNDY1MDY4fQ.qbO0KymO7nLymwexLcZ2SK4n1owTDU5U63DoNoIygTE';

/**
 * Get a singleton instance of the Supabase client with anonymous key
 * This prevents "Multiple GoTrueClient instances detected" warnings
 * and ensures consistent initialization across the app
 */
export function getSupabaseClient() {
  if (globalForSupabase.supabaseInstance) return globalForSupabase.supabaseInstance;
  
  // Use environment variables if available, otherwise use hardcoded values
  // This ensures the client works in both server and client contexts
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  
  console.log('Initializing Supabase client with URL:', supabaseUrl);

  // Initialize Supabase client with standard options
  globalForSupabase.supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
  
  return globalForSupabase.supabaseInstance;
}

/**
 * Get a singleton instance of the Supabase client with service role key
 * This client has admin privileges and can bypass RLS policies
 * Use this for admin operations like file uploads that need to bypass RLS
 */
export function getSupabaseAdminClient() {
  if (globalForSupabase.supabaseAdminInstance) return globalForSupabase.supabaseAdminInstance;
  
  // Use environment variables if available, otherwise use hardcoded values
  // This ensures the client works in both server and client contexts
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Initializing Supabase admin client with URL:', supabaseUrl);

  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Using development mode with mock functionality.');
  }

  // Initialize Supabase admin client with service role key
  globalForSupabase.supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return globalForSupabase.supabaseAdminInstance;
}
