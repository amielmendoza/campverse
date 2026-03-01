import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cachedQuery, invalidateCache } from '../lib/queryCache'
import type { Location } from '../lib/types'

export interface LocationWithCount extends Location {
  memberCount: number
}

async function fetchLocationsData(): Promise<LocationWithCount[]> {
  const { data: locationData, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (locationError) throw locationError
  if (!locationData || locationData.length === 0) return []

  const locationIds = locationData.map((l) => l.id)

  const { data: memberData, error: memberError } = await supabase
    .from('location_memberships')
    .select('location_id')
    .in('location_id', locationIds)

  if (memberError) throw memberError

  const countMap: Record<string, number> = {}
  for (const row of memberData ?? []) {
    countMap[row.location_id] = (countMap[row.location_id] ?? 0) + 1
  }

  return locationData.map((loc) => ({
    ...loc,
    memberCount: countMap[loc.id] ?? 0,
  }))
}

export function useLocations() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<LocationWithCount[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const userRef = useRef(user)
  userRef.current = user

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await cachedQuery(
        'locations:list',
        fetchLocationsData,
        { ttl: 60_000, staleWhileRevalidate: true },
        (freshData) => setLocations(freshData),
      )
      setLocations(result)
    } catch (err: unknown) {
      console.error('Locations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCounts = useCallback(async () => {
    const u = userRef.current
    if (!u) {
      setUnreadCounts({})
      return
    }

    try {
      const counts = await cachedQuery(
        `unread:${u.id}`,
        async () => {
          const { data: memberships } = await supabase
            .from('location_memberships')
            .select('location_id, last_read_at')
            .eq('user_id', u.id)

          if (!memberships || memberships.length === 0) return {}

          const locationIds = memberships.map((m) => m.location_id)
          const oldestReadAt = memberships.reduce(
            (oldest, m) => (m.last_read_at < oldest ? m.last_read_at : oldest),
            memberships[0].last_read_at,
          )

          const { data: messages } = await supabase
            .from('messages')
            .select('location_id, created_at')
            .in('location_id', locationIds)
            .gt('created_at', oldestReadAt)
            .neq('user_id', u.id)

          if (!messages || messages.length === 0) return {}

          const readAtMap: Record<string, string> = {}
          for (const m of memberships) {
            readAtMap[m.location_id] = m.last_read_at
          }

          const result: Record<string, number> = {}
          for (const msg of messages) {
            if (msg.created_at > readAtMap[msg.location_id]) {
              result[msg.location_id] = (result[msg.location_id] ?? 0) + 1
            }
          }

          return result
        },
        { ttl: 30_000, staleWhileRevalidate: true },
        (freshCounts) => setUnreadCounts(freshCounts),
      )
      setUnreadCounts(counts)
    } catch {
      // Non-critical — don't break the page for unread count errors
    }
  }, [])

  useEffect(() => {
    fetchLocations()
    fetchUnreadCounts()
  }, [fetchLocations, fetchUnreadCounts])

  // Subscribe to new messages to update unread counts in realtime
  useEffect(() => {
    if (!userRef.current) return

    const channel = supabase
      .channel('locations-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          invalidateCache('unread:')
          fetchUnreadCounts()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchUnreadCounts])

  return { locations, unreadCounts, loading, error, refetch: fetchLocations }
}
