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

  // Stable ref for user to avoid subscription churn
  const userRef = useRef(user)
  userRef.current = user

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

  // Fetch unread counts — single query using RPC-like approach instead of N+1
  const fetchUnreadCounts = useCallback(async () => {
    const u = userRef.current
    if (!u) {
      setUnreadCounts({})
      return
    }

    // Get user's memberships with last_read_at
    const { data: memberships } = await supabase
      .from('location_memberships')
      .select('location_id, last_read_at')
      .eq('user_id', u.id)

    if (!memberships || memberships.length === 0) {
      setUnreadCounts({})
      return
    }

    // Batch: fetch all recent messages across all member locations in ONE query
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

    if (!messages || messages.length === 0) {
      setUnreadCounts({})
      return
    }

    // Build a lookup of last_read_at per location
    const readAtMap: Record<string, string> = {}
    for (const m of memberships) {
      readAtMap[m.location_id] = m.last_read_at
    }

    // Count unread per location client-side
    const counts: Record<string, number> = {}
    for (const msg of messages) {
      if (msg.created_at > readAtMap[msg.location_id]) {
        counts[msg.location_id] = (counts[msg.location_id] ?? 0) + 1
      }
    }

    setUnreadCounts(counts)
  }, []) // stable — reads user from ref

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
  }, [fetchUnreadCounts])

  return { locations, unreadCounts, loading, error, refetch: fetchLocations }
}
