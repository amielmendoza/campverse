import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cachedQuery, invalidateCacheKey } from '../lib/queryCache'
import { guardedMutation } from '../lib/mutationGuard'
import type { BookingStatus } from '../lib/types'

export interface OwnerBooking {
  id: string
  location_id: string
  user_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: BookingStatus
  owner_note: string | null
  created_at: string
  updated_at: string
  location_name: string
  camper_name: string
  camper_username: string
}

interface BookingRow {
  id: string
  location_id: string
  user_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  owner_note: string | null
  created_at: string
  updated_at: string
  locations: { name: string } | null
  profiles: { username: string; display_name: string | null } | null
}

export function useOwnerBookings() {
  const { user, ownedLocationIds } = useAuth()
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userRef = useRef(user)
  userRef.current = user
  const ownedIdsRef = useRef(ownedLocationIds)
  ownedIdsRef.current = ownedLocationIds

  const fetchBookings = useCallback(async () => {
    const u = userRef.current
    const ids = ownedIdsRef.current
    if (!u || ids.length === 0) {
      setBookings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await cachedQuery(
        `bookings:owner:${u.id}`,
        async () => {
          const { data, error: fetchError } = await supabase
            .from('bookings')
            .select('*, locations:location_id(name), profiles:user_id(username, display_name)')
            .in('location_id', ids)
            .order('created_at', { ascending: false })

          if (fetchError) throw fetchError

          return (data as BookingRow[] ?? []).map((row) => ({
            id: row.id,
            location_id: row.location_id,
            user_id: row.user_id,
            check_in: row.check_in,
            check_out: row.check_out,
            guests: row.guests,
            total_price: row.total_price,
            status: row.status as BookingStatus,
            owner_note: row.owner_note,
            created_at: row.created_at,
            updated_at: row.updated_at,
            location_name: row.locations?.name ?? 'Unknown',
            camper_name: row.profiles?.display_name ?? row.profiles?.username ?? 'Unknown',
            camper_username: row.profiles?.username ?? '',
          }))
        },
        { ttl: 30_000, staleWhileRevalidate: true },
        (freshData) => setBookings(freshData),
      )
      setBookings(result)
    } catch (err) {
      console.error('Owner bookings fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Realtime subscription for all owned locations
  useEffect(() => {
    const u = userRef.current
    const ids = ownedIdsRef.current
    if (!u || ids.length === 0) return

    const channel = supabase
      .channel(`bookings:owner:${u.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { location_id?: string }
          if (row.location_id && ids.includes(row.location_id)) {
            invalidateCacheKey(`bookings:owner:${u.id}`)
            fetchBookings()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchBookings])

  const confirmBooking = useCallback(
    async (bookingId: string, note?: string) => {
      await guardedMutation(`confirm:${bookingId}`, async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            owner_note: note || null,
          })
          .eq('id', bookingId)

        if (updateError) throw updateError
        invalidateCacheKey(`bookings:owner:${userRef.current?.id}`)
        await fetchBookings()
      })
    },
    [fetchBookings],
  )

  const rejectBooking = useCallback(
    async (bookingId: string, note?: string) => {
      await guardedMutation(`reject:${bookingId}`, async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'rejected',
            owner_note: note || null,
          })
          .eq('id', bookingId)

        if (updateError) throw updateError
        invalidateCacheKey(`bookings:owner:${userRef.current?.id}`)
        await fetchBookings()
      })
    },
    [fetchBookings],
  )

  const markCompleted = useCallback(
    async (bookingId: string) => {
      await guardedMutation(`complete:${bookingId}`, async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingId)

        if (updateError) throw updateError
        invalidateCacheKey(`bookings:owner:${userRef.current?.id}`)
        await fetchBookings()
      })
    },
    [fetchBookings],
  )

  return { bookings, loading, error, confirmBooking, rejectBooking, markCompleted, refetch: fetchBookings }
}
