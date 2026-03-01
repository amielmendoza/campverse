import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLocationMembers } from '../hooks/useLocationMembers'
import { cachedQuery } from '../lib/queryCache'
import type { LocationWithCount } from '../hooks/useLocations'
import { LocationDetail } from '../components/locations/LocationDetail'
import { MemberList } from '../components/locations/MemberList'
import { ChatRoom } from '../components/chat/ChatRoom'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BookingFormModal } from '../components/bookings/BookingFormModal'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useBookings } from '../hooks/useBookings'
import type { Location } from '../lib/types'

export function LocationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isOwner } = useAuth()
  const [locationData, setLocationData] = useState<Location | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function fetchLocation() {
      setPageLoading(true)
      setError(null)

      try {
        const data = await cachedQuery(
          `location:slug:${slug}`,
          async () => {
            const { data, error: fetchError } = await supabase
              .from('locations')
              .select('*')
              .eq('slug', slug!)
              .single()

            if (fetchError || !data) throw new Error('Location not found.')
            return data
          },
          { ttl: 60_000, staleWhileRevalidate: true },
          (freshData) => setLocationData(freshData),
        )

        if (cancelled) return
        setLocationData(data)
      } catch {
        if (cancelled) return
        setError('Location not found.')
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }

    fetchLocation()

    return () => {
      cancelled = true
    }
  }, [slug])

  const { members, isMember, loading: membersLoading, join, leave } =
    useLocationMembers(locationData?.id)

  // Derive member count from members array (no separate query needed)
  const location: LocationWithCount | null = useMemo(
    () => locationData ? { ...locationData, memberCount: members.length } : null,
    [locationData, members.length],
  )

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const { createBooking } = useCreateBooking()
  const { markPaymentSubmitted } = useBookings()

  const handleJoin = async () => {
    if (!location) return
    setActionLoading(true)
    setActionError(null)
    try {
      await join(location.id)
    } catch (err) {
      console.error('Failed to join:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to join location.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!location) return
    setActionLoading(true)
    setActionError(null)
    try {
      await leave(location.id)
    } catch (err) {
      console.error('Failed to leave:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to leave location.')
    } finally {
      setActionLoading(false)
    }
  }

  if (pageLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (error || !location) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-lg text-stone-500">{error ?? 'Location not found.'}</p>
        <Link
          to="/locations"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Back to locations
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/locations"
          className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to locations
        </Link>
        {location && isOwner(location.id) && (
          <Link
            to="/my-locations"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            Manage
          </Link>
        )}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <LocationDetail
        location={location}
        isMember={isMember}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onBook={((location.rate_options && Array.isArray(location.rate_options) && location.rate_options.length > 0) || location.price_per_night != null) && location.payment_qr_url ? () => setBookingOpen(true) : undefined}
        loading={actionLoading}
      />

      {((location.rate_options && Array.isArray(location.rate_options) && location.rate_options.length > 0) || location.price_per_night != null) && location.payment_qr_url && (
        <BookingFormModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          onSubmit={async (checkIn, checkOut, guests, totalPrice, rateSelections) => {
            return await createBooking(location.id, checkIn, checkOut, guests, totalPrice, rateSelections)
          }}
          onMarkPaid={markPaymentSubmitted}
          location={location}
        />
      )}

      {/* Community Section */}
      <hr className="my-8 border-stone-200" />
      <h2 className="mb-6 text-xl font-semibold text-stone-900">Community</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isMember ? (
            <div className="h-[500px] overflow-hidden rounded-xl border border-stone-200">
              <ChatRoom locationId={location.id} />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
              <div className="text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <p className="mb-3 text-sm text-stone-500">
                  Join this camp to access the community chat
                </p>
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  Join Now
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          {membersLoading ? <LoadingSpinner /> : <MemberList members={members} />}
        </div>
      </div>
    </div>
  )
}
