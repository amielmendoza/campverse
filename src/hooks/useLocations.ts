import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Location } from '../lib/types'

export interface LocationWithCount extends Location {
  memberCount: number
}

export function useLocations() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<LocationWithCount[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all active locations
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (locationError) throw locationError

      if (!locationData || locationData.length === 0) {
        setLocations([])
        setLoading(false)
        return
      }

      // Fetch member counts for each location
      const locationIds = locationData.map((l) => l.id)

      const { data: memberData, error: memberError } = await supabase
        .from('location_memberships')
        .select('location_id')
        .in('location_id', locationIds)

      if (memberError) throw memberError

      // Count members per location
      const countMap: Record<string, number> = {}
      for (const row of memberData ?? []) {
        countMap[row.location_id] = (countMap[row.location_id] ?? 0) + 1
      }

      const locationsWithCounts: LocationWithCount[] = locationData.map((loc) => ({
        ...loc,
        memberCount: countMap[loc.id] ?? 0,
      }))

      setLocations(locationsWithCounts)
    } catch (err: unknown) {
      console.error('Locations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch unread message counts for the current user's memberships
  const fetchUnreadCounts = useCallback(async () => {
    if (!user) {
      setUnreadCounts({})
      return
    }

    // Get user's memberships with last_read_at
    const { data: memberships } = await supabase
      .from('location_memberships')
      .select('location_id, last_read_at')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      setUnreadCounts({})
      return
    }

    // For each membership, count messages newer than last_read_at from other users
    const counts: Record<string, number> = {}
    await Promise.all(
      memberships.map(async (m) => {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('location_id', m.location_id)
          .gt('created_at', m.last_read_at)
          .neq('user_id', user.id)

        if (count && count > 0) {
          counts[m.location_id] = count
        }
      }),
    )

    setUnreadCounts(counts)
  }, [user])

  useEffect(() => {
    fetchLocations()
    fetchUnreadCounts()
  }, [fetchLocations, fetchUnreadCounts])

  // Subscribe to new messages to update unread counts in realtime
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('locations-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchUnreadCounts(),
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, fetchUnreadCounts])

  return { locations, unreadCounts, loading, error, refetch: fetchLocations }
}
