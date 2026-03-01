import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '../hooks/useBookings'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { BookingStatus } from '../lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getNights(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const canCancel = (status: BookingStatus) =>
  status === 'pending_payment' || status === 'pending_confirmation'

export function MyBookingsPage() {
  const { bookings, loading, error, cancelBooking } = useBookings()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleAction(id: string, action: () => Promise<void>) {
    setActionLoading(id)
    try {
      await action()
    } catch (err) {
      console.error('Booking action error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-stone-900">My Bookings</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {bookings.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="mx-auto mb-3 h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p className="mb-2 text-lg text-stone-500">No bookings yet</p>
          <p className="text-sm text-stone-400">
            Browse <Link to="/locations" className="text-emerald-600 hover:text-emerald-700">locations</Link> to book your first camping trip!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const nights = getNights(booking.check_in, booking.check_out)
            const isLoading = actionLoading === booking.id

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Location image */}
                  <div className="h-32 w-full shrink-0 sm:h-auto sm:w-40">
                    {booking.location_image_url ? (
                      <img
                        src={booking.location_image_url}
                        alt={booking.location_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200">
                        <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Booking details */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Link
                          to={`/locations/${booking.location_slug}`}
                          className="text-lg font-semibold text-stone-900 hover:text-emerald-700"
                        >
                          {booking.location_name}
                        </Link>
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                        <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                        <span>{nights} night{nights > 1 ? 's' : ''}</span>
                        <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
                      </div>

                      <p className="text-lg font-bold text-stone-900">
                        PHP {booking.total_price.toLocaleString()}
                      </p>

                      {booking.owner_note && (
                        <p className="mt-2 rounded-md bg-stone-50 p-2 text-sm text-stone-600">
                          <span className="font-medium">Note:</span> {booking.owner_note}
                        </p>
                      )}
                    </div>

                    {/* Receipt preview */}
                    {booking.receipt_url && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs font-medium text-stone-500">Payment Receipt</p>
                        <a href={booking.receipt_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={booking.receipt_url}
                            alt="Payment receipt"
                            className="h-20 rounded-md border border-stone-200 object-contain"
                          />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    {canCancel(booking.status) && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleAction(booking.id, () => cancelBooking(booking.id))}
                          disabled={isLoading}
                          className="rounded-lg border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
