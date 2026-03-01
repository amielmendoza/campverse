import { useState } from 'react'
import { useOwnerLocations } from '../hooks/useOwnerLocations'
import { useOwnerBookings } from '../hooks/useOwnerBookings'
import { LocationFormModal } from '../components/admin/LocationFormModal'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { LocationFormData } from '../hooks/useAdminLocations'
import type { Location, BookingStatus } from '../lib/types'

type MainTab = 'locations' | 'bookings'
type BookingFilter = 'all' | 'pending' | 'confirmed' | 'past'

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

export function MyLocationsPage() {
  const { locations, pendingRequests, loading, error, submitChangeRequest } = useOwnerLocations()
  const { bookings, loading: bookingsLoading, error: bookingsError, confirmBooking, rejectBooking, markCompleted } = useOwnerBookings()

  const [activeTab, setActiveTab] = useState<MainTab>('locations')
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Booking management state
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const pendingBookingCount = bookings.filter((b) => isPending(b.status)).length

  function handleEdit(location: Location) {
    setEditingLocation(location)
    setFormOpen(true)
    setSuccessMessage(null)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingLocation(null)
  }

  async function handleFormSubmit(data: LocationFormData) {
    if (editingLocation) {
      await submitChangeRequest(editingLocation.id, data)
      setSuccessMessage('Changes submitted for admin approval.')
    }
  }

  function getPendingForLocation(locationId: string) {
    return pendingRequests.filter(
      (r) => r.location_id === locationId && r.status === 'pending',
    )
  }

  function getLatestRejected(locationId: string) {
    return pendingRequests.find(
      (r) => r.location_id === locationId && r.status === 'rejected',
    )
  }

  async function handleBookingAction(id: string, action: () => Promise<void>) {
    setActionLoading(id)
    try {
      await action()
    } catch (err) {
      console.error('Booking action error:', err)
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

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'pending') return isPending(b.status)
    if (bookingFilter === 'confirmed') return isConfirmed(b.status)
    if (bookingFilter === 'past') return isPast(b.status)
    return true
  })

  const bookingFilterTabs: { key: BookingFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending', count: pendingBookingCount },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'past', label: 'Past' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
          My Locations
        </h1>
        <p className="mt-1 text-stone-500">
          Manage locations you own. Changes require admin approval.
        </p>
      </div>

      {/* Main tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'locations'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Locations
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Bookings
          {pendingBookingCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
              {pendingBookingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Locations Tab ── */}
      {activeTab === 'locations' && (
        <>
          {successMessage && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {loading && <LoadingSpinner size="lg" />}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && locations.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-stone-300 p-12 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-stone-700">No locations assigned</h3>
              <p className="text-sm text-stone-500">
                You don&apos;t own any locations yet. An admin can assign you as the owner of a location.
              </p>
            </div>
          )}

          {!loading && !error && locations.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-3 font-semibold text-stone-600">Name</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">Region</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">Capacity</th>
                      <th className="px-4 py-3 text-right font-semibold text-stone-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {locations.map((location) => {
                      const pending = getPendingForLocation(location.id)
                      const rejected = getLatestRejected(location.id)
                      return (
                        <tr key={location.id} className="transition-colors hover:bg-stone-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-900">{location.name}</span>
                              {pending.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  Pending
                                </span>
                              )}
                            </div>
                            {rejected && !pending.length && (
                              <p className="mt-0.5 text-xs text-red-500">
                                Last change rejected{rejected.admin_note ? `: ${rejected.admin_note}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {location.region || '\u2014'}
                          </td>
                          <td className="px-4 py-3">
                            {location.is_active ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-stone-600">
                            {location.capacity ?? '\u2014'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleEdit(location)}
                                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-emerald-600"
                                title="Edit"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <LocationFormModal
            isOpen={formOpen}
            onClose={handleCloseForm}
            onSubmit={handleFormSubmit}
            initialData={editingLocation}
          />
        </>
      )}

      {/* ── Bookings Tab ── */}
      {activeTab === 'bookings' && (
        <>
          {bookingsError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{bookingsError}</div>
          )}

          {bookingsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              {/* Booking filter tabs */}
              <div className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
                {bookingFilterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBookingFilter(tab.key)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      bookingFilter === tab.key
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

              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <svg className="mx-auto mb-3 h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <p className="text-lg text-stone-500">No bookings found</p>
                  <p className="mt-1 text-sm text-stone-400">
                    {bookingFilter !== 'all' ? 'Try a different filter.' : 'Bookings from campers will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <div className="overflow-x-auto">
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
                        {filteredBookings.map((booking) => {
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
                                        onClick={() => handleBookingAction(booking.id, () => confirmBooking(booking.id))}
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
                                      onClick={() => handleBookingAction(booking.id, () => markCompleted(booking.id))}
                                      disabled={isLoading}
                                      className="rounded bg-stone-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                                    >
                                      Complete
                                    </button>
                                  )}
                                </div>

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
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
