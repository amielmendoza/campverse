import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use a simple lock that doesn't rely on navigator.locks (which fails in InPrivate/Incognito)
let lockPromise: Promise<any> = Promise.resolve()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'campverse-auth',
    persistSession: true,
    detectSessionInUrl: true,
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      // Simple sequential lock — queue operations to avoid race conditions
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
