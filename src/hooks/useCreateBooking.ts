import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { guardedMutation } from '../lib/mutationGuard'
import type { RateSelection } from '../lib/types'

export function useCreateBooking() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(
    async (
      locationId: string,
      checkIn: string,
      checkOut: string,
      guests: number,
      totalPrice: number,
      rateSelections?: RateSelection[],
    ) => {
      if (!user) throw new Error('Must be signed in to book')

      setLoading(true)
      setError(null)

      try {
        const bookingId = await guardedMutation(`book:${locationId}:${checkIn}`, async () => {
          const { data, error: insertError } = await supabase
            .from('bookings')
            .insert({
              location_id: locationId,
              user_id: user.id,
              check_in: checkIn,
              check_out: checkOut,
              guests,
              total_price: totalPrice,
              rate_selections: rateSelections as unknown as Record<string, unknown>[] | undefined,
            })
            .select('id')
            .single()

          if (insertError || !data) {
            throw insertError ?? new Error('Booking was not created')
          }

          return data.id
        })

        return bookingId as string
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  return { createBooking, loading, error }
}
