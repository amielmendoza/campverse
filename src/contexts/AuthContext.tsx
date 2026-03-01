import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  ownedLocationIds: string[]
  isOwner: (locationId: string) => boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error.message)
    throw new Error(error.message)
  }

  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedLocationIds, setOwnedLocationIds] = useState<string[]>([])

  const isOwner = useCallback(
    (locationId: string) => ownedLocationIds.includes(locationId),
    [ownedLocationIds],
  )

  useEffect(() => {
    let mounted = true

    // Use onAuthStateChange as the single source of truth.
    // It fires immediately with the current session (INITIAL_SESSION event).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        try {
          const p = await fetchProfile(newSession.user.id)
          if (mounted) {
            setProfile(p)
            setError(null)
          }
          // Fetch owned location IDs
          const { data: ownedData } = await supabase
            .from('locations')
            .select('id')
            .eq('owner_id', newSession.user.id)
          if (mounted) {
            setOwnedLocationIds(ownedData?.map((l) => l.id) ?? [])
          }
        } catch (err: unknown) {
          if (mounted) {
            setProfile(null)
            setError(err instanceof Error ? err.message : 'Failed to load profile')
          }
        }
      } else {
        setProfile(null)
        setOwnedLocationIds([])
        setError(null)
      }

      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, isAdmin: profile?.is_admin ?? false, ownedLocationIds, isOwner, error, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
