import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../lib/types'

export interface LocationMember {
  id: string
  user_id: string
  location_id: string
  joined_at: string
  profile: {
    display_name: string | null
    avatar_url: string | null
    username: string
  }
}

export function useLocationMembers(locationId: string | undefined) {
  const { user } = useAuth()
  const [members, setMembers] = useState<LocationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!locationId) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('location_memberships')
        .select(`
          id,
          user_id,
          location_id,
          joined_at,
          profiles!location_memberships_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('location_id', locationId)

      if (error) throw error

      const mapped: LocationMember[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        location_id: row.location_id,
        joined_at: row.joined_at,
        profile: {
          username: row.profiles?.username ?? '',
          display_name: row.profiles?.display_name ?? null,
          avatar_url: row.profiles?.avatar_url ?? null,
        },
      }))

      setMembers(mapped)
      setIsMember(user ? mapped.some((m) => m.user_id === user.id) : false)
    } catch (err) {
      console.error('Error fetching location members:', err)
    } finally {
      setLoading(false)
    }
  }, [locationId, user])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Subscribe to realtime changes on memberships
  useEffect(() => {
    if (!locationId) return

    const channel = supabase
      .channel(`memberships:${locationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_memberships',
          filter: `location_id=eq.${locationId}`,
        },
        () => {
          fetchMembers()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'location_memberships',
        },
        () => {
          fetchMembers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [locationId, fetchMembers])

  const join = useCallback(
    async (locId: string) => {
      if (!user) throw new Error('Must be signed in to join a location')

      const { error } = await supabase.from('location_memberships').insert({
        user_id: user.id,
        location_id: locId,
      })

      if (error) throw error
      await fetchMembers()
    },
    [user, fetchMembers],
  )

  const leave = useCallback(
    async (locId: string) => {
      if (!user) throw new Error('Must be signed in to leave a location')

      const { error } = await supabase
        .from('location_memberships')
        .delete()
        .eq('user_id', user.id)
        .eq('location_id', locId)

      if (error) throw error
      await fetchMembers()
    },
    [user, fetchMembers],
  )

  return { members, isMember, loading, join, leave }
}
