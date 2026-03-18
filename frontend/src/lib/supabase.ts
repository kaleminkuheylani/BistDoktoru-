import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return createClient(url, key)
}

// Legacy export for compatibility
export const supabase = {
  from: (...args: Parameters<ReturnType<typeof createClient>['from']>) =>
    getSupabaseClient().from(...args)
}

export type WatchlistItem = {
  id: string
  symbol: string
  name: string
  user_id: string
  created_at: string
}
