import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseSession } from './session'

export function createAnonClient(s: SupabaseSession): SupabaseClient {
  return createClient(s.url, s.anonKey, { auth: { persistSession: false } })
}

export function createServiceClient(s: SupabaseSession): SupabaseClient {
  if (!s.serviceKey) throw new Error('No service key in session')
  return createClient(s.url, s.serviceKey, { auth: { persistSession: false } })
}
