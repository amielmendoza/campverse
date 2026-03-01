import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { cachedQuery, invalidateCacheKey } from '../lib/queryCache'
import { guardedMutation } from '../lib/mutationGuard'
import type { BookingStatus } from '../lib/types'

export interface BookingWithLocation {
  id: string
  location_id: string
  user_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: BookingStatus
  owner_note: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
  location_name: string
  location_slug: string
  location_image_url: string | null
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
  receipt_url: string | null
  created_at: string
  updated_at: string
  locations: {
    name: string
    slug: string
    image_url: string | null
  } | null
}

export function useBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userRef = useRef(user)
  userRef.current = user

  const fetchBookings = useCallback(async () => {
    const u = userRef.current
    if (!u) {
      setBookings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await cachedQuery(
        `bookings:user:${u.id}`,
        async () => {
          const { data, error: fetchError } = await supabase
            .from('bookings')
            .select('*, locations:location_id(name, slug, image_url)')
            .eq('user_id', u.id)
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
            receipt_url: row.receipt_url,
            created_at: row.created_at,
            updated_at: row.updated_at,
            location_name: row.locations?.name ?? 'Unknown',
            location_slug: row.locations?.slug ?? '',
            location_image_url: row.locations?.image_url ?? null,
          }))
        },
        { ttl: 30_000, staleWhileRevalidate: true },
        (freshData) => setBookings(freshData),
      )
      setBookings(result)
    } catch (err) {
      console.error('Bookings fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Realtime subscription
  useEffect(() => {
    const u = userRef.current
    if (!u) return

    const channel = supabase
      .channel(`bookings:user:${u.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${u.id}`,
        },
        () => {
          invalidateCacheKey(`bookings:user:${u.id}`)
          fetchBookings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchBookings])

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      await guardedMutation(`cancel:${bookingId}`, async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)

        if (updateError) throw updateError
        invalidateCacheKey(`bookings:user:${userRef.current?.id}`)
        await fetchBookings()
      })
    },
    [fetchBookings],
  )

  const markPaymentSubmitted = useCallback(
    async (bookingId: string, receiptUrl: string) => {
      await guardedMutation(`markpaid:${bookingId}`, async () => {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'pending_confirmation', receipt_url: receiptUrl })
          .eq('id', bookingId)

        if (updateError) throw updateError
        invalidateCacheKey(`bookings:user:${userRef.current?.id}`)
        await fetchBookings()
      })
    },
    [fetchBookings],
  )

  return { bookings, loading, error, cancelBooking, markPaymentSubmitted, refetch: fetchBookings }
}
