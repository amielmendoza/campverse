import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'campverse-auth',
    persistSession: true,
    detectSessionInUrl: true,
    // No custom lock — use browser's navigator.locks which handles
    // re-entrant acquisition and tab visibility changes correctly
  },
})
