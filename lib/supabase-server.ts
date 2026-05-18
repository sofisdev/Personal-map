import { createClient } from '@supabase/supabase-js'

// This module must never be imported in client components.
// It uses the service role key which bypasses all RLS policies.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
