import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, clientOptions)

export function createSupabaseAuthClient() {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY ?? env.SUPABASE_SERVICE_KEY,
    clientOptions,
  )
}
