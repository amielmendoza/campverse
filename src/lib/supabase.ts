import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// navigator.locks is unavailable in InPrivate/Incognito mode on some browsers,
// causing Supabase auth to hang. This sequential lock provides a safe fallback.
let lockPromise: Promise<unknown> = Promise.resolve()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'campverse-auth',
    persistSession: true,
    detectSessionInUrl: true,
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      const prev = lockPromise
      let resolve: () => void
      lockPromise = new Promise<void>((r) => { resolve = r })
      await prev
      try {
        return await fn()
      } finally {
        resolve!()
      }
    },
  },
})
