import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOwnerBookings } from '../hooks/useOwnerBookings'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { BookingStatus } from '../lib/types'

type FilterTab = 'all' | 'pending' | 'confirmed' | 'past'

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

const isPending = (s: BookingStatus) => s === 'pending_payment' || s === 'pending_confirmation'
const isConfirmed = (s: BookingStatus) => s === 'confirmed'
const isPast = (s: BookingStatus) => s === 'completed' || s === 'cancelled' || s === 'rejected'

export function OwnerBookingsPage() {
  const { bookings, loading, error, confirmBooking, rejectBooking, markCompleted } = useOwnerBookings()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const filtered = bookings.filter((b) => {
    if (filter === 'pending') return isPending(b.status)
    if (filter === 'confirmed') return isConfirmed(b.status)
    if (filter === 'past') return isPast(b.status)
    return true
  })

  const pendingCount = bookings.filter((b) => isPending(b.status)).length

  async function handleAction(id: string, action: () => Promise<void>) {
    setActionLoading(id)
    try {
      await action()
    } catch (err) {
      console.error('Owner booking action error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    try {
      await rejectBooking(id, rejectNote)
      setRejectingId(null)
      setRejectNote('')
    } catch (err) {
      console.error('Reject error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <LoadingSpinner size="lg" />

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'past', label: 'Past' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Manage Bookings</h1>
        <Link
          to="/my-locations"
          className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          My Locations
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-stone-500">No bookings found</p>
          <p className="mt-1 text-sm text-stone-400">
            {filter !== 'all' ? 'Try a different filter.' : 'Bookings from campers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3">Camper</th>
                <th className="hidden px-4 py-3 sm:table-cell">Location</th>
                <th className="px-4 py-3">Dates</th>
                <th className="hidden px-4 py-3 md:table-cell">Guests</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((booking) => {
                const nights = getNights(booking.check_in, booking.check_out)
                const isLoading = actionLoading === booking.id
                const isRejecting = rejectingId === booking.id

                return (
                  <tr key={booking.id} className="bg-white hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{booking.camper_name}</div>
                      <div className="text-xs text-stone-400">@{booking.camper_username}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">{booking.location_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-stone-900">{formatDate(booking.check_in)}</div>
                      <div className="text-xs text-stone-400">{nights} night{nights > 1 ? 's' : ''}</div>
                    </td>
                    <td className="hidden px-4 py-3 text-stone-600 md:table-cell">{booking.guests}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">PHP {booking.total_price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {booking.receipt_url && (
                          <a
                            href={booking.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Receipt
                          </a>
                        )}
                        {booking.status === 'pending_confirmation' && (
                          <>
                            <button
                              onClick={() => handleAction(booking.id, () => confirmBooking(booking.id))}
                              disabled={isLoading}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRejectingId(isRejecting ? null : booking.id)}
                              disabled={isLoading}
                              className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleAction(booking.id, () => markCompleted(booking.id))}
                            disabled={isLoading}
                            className="rounded bg-stone-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                      </div>

                      {/* Reject note input */}
                      {isRejecting && (
                        <div className="mt-2 flex gap-1">
                          <input
                            type="text"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Reason (optional)"
                            className="w-full rounded border border-stone-300 px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleReject(booking.id)}
                            disabled={isLoading}
                            className="shrink-0 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
