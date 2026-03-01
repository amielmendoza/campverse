import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { debounce } from '../lib/utils/debounce'
import { cachedQuery, invalidateCacheKey } from '../lib/queryCache'
import { guardedMutation } from '../lib/mutationGuard'

interface MembershipRow {
  id: string
  user_id: string
  location_id: string
  joined_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

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
  const hasFetchedOnce = useRef(false)

  // Derive isMember from members array instead of separate state
  const isMember = useMemo(
    () => (user ? members.some((m) => m.user_id === user.id) : false),
    [members, user],
  )

  const fetchMembers = useCallback(async () => {
    if (!locationId) {
      setMembers([])
      setLoading(false)
      return
    }

    if (!hasFetchedOnce.current) setLoading(true)

    try {
      const mapped = await cachedQuery(
        `members:${locationId}`,
        async () => {
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

          return (data ?? []).map((row: MembershipRow) => ({
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
        },
        { ttl: 30_000, staleWhileRevalidate: true },
        (freshData) => setMembers(freshData),
      )

      setMembers(mapped)
    } catch (err: unknown) {
      console.error('Error fetching location members:', err instanceof Error ? err.message : err)
    } finally {
      hasFetchedOnce.current = true
      setLoading(false)
    }
  }, [locationId])

  // Debounced refetch for realtime callbacks (300ms)
  const debouncedFetch = useMemo(() => debounce(fetchMembers, 300), [fetchMembers])

  // Reset when location changes
  useEffect(() => {
    hasFetchedOnce.current = false
  }, [locationId])

  // Initial load
  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Realtime subscription (no polling — realtime is sufficient here)
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
        () => debouncedFetch(),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'location_memberships',
        },
        (payload) => {
          // Supabase Realtime does not support column filters on DELETE events,
          // so we subscribe to all DELETEs and check the location_id manually.
          const old = payload.old as Record<string, unknown>
          if (old.location_id !== locationId) return
          debouncedFetch()
        },
      )
      .subscribe()

    return () => {
      debouncedFetch.cancel()
      supabase.removeChannel(channel)
    }
  }, [locationId, debouncedFetch])

  const join = useCallback(
    async (locId: string) => {
      if (!user) throw new Error('Must be signed in to join a location')

      await guardedMutation(`join:${locId}`, async () => {
        const { error } = await supabase.from('location_memberships').insert({
          user_id: user.id,
          location_id: locId,
        })

        if (error) throw error
        invalidateCacheKey(`members:${locId}`)
        invalidateCacheKey('locations:list')
        await fetchMembers()
      })
    },
    [user, fetchMembers],
  )

  const leave = useCallback(
    async (locId: string) => {
      if (!user) throw new Error('Must be signed in to leave a location')

      await guardedMutation(`leave:${locId}`, async () => {
        const { error } = await supabase
          .from('location_memberships')
          .delete()
          .eq('user_id', user.id)
          .eq('location_id', locId)

        if (error) throw error
        invalidateCacheKey(`members:${locId}`)
        invalidateCacheKey('locations:list')
        await fetchMembers()
      })
    },
    [user, fetchMembers],
  )

  return { members, isMember, loading, join, leave }
}
