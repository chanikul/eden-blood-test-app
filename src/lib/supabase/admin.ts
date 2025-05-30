import { createClient } from '@supabase/supabase-js';

console.log('Initializing Supabase Admin client...');

// Check required environment variables
if (!process.env.SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL environment variable');
  throw new Error('Missing SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Show partial key for debugging (first 5 chars only)
const maskedKey = process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...';
console.log('Supabase configuration found:', {
  url: process.env.SUPABASE_URL,
  serviceRoleKey: maskedKey,
});

// Create a Supabase client with the service role key for admin operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Supabase Admin client initialized successfully');
