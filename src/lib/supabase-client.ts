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
  
  // Provide a fallback dummy key for build time - this won't be used in production
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemZobm53eXZkZGFvaWtydW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcyNjUzMzgsImV4cCI6MjAwMjg0MTMzOH0.dummy-key-for-build';

  // Initialize Supabase client
  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey);
  
  return supabaseInstance;
}
