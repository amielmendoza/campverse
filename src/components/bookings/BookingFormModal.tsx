import { useState, type FormEvent } from 'react'
import type { Location } from '../../lib/types'
import { inputClassName, labelClassName } from '../../lib/utils/styles'
import { useFocusTrap } from '../../lib/utils/useFocusTrap'
import { CloseIcon } from '../ui/CloseIcon'

interface BookingFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (checkIn: string, checkOut: string, guests: number, totalPrice: number) => Promise<void>
  location: Location
}

function getNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function BookingFormModal({ isOpen, onClose, onSubmit, location }: BookingFormModalProps) {
  const trapRef = useFocusTrap(isOpen)
  const today = getTodayStr()

  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const pricePerNight = location.price_per_night ?? 0
  const nights = getNights(checkIn, checkOut)
  const totalPrice = nights * pricePerNight

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates.')
      return
    }
    if (nights <= 0) {
      setError('Check-out must be after check-in.')
      return
    }
    if (checkIn < today) {
      setError('Check-in date cannot be in the past.')
      return
    }
    const guestCount = parseInt(guests, 10)
    if (!guestCount || guestCount < 1) {
      setError('At least 1 guest is required.')
      return
    }
    if (location.capacity && guestCount > location.capacity) {
      setError(`This campsite has a maximum capacity of ${location.capacity} guests.`)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(checkIn, checkOut, guestCount, totalPrice)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setSuccess(false)
    setError(null)
    setCheckIn(today)
    setCheckOut('')
    setGuests('1')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-form-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : handleClose} />

      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 id="booking-form-title" className="text-lg font-semibold text-stone-900">
            Book {location.name}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-stone-900">Booking Submitted!</h3>
            <p className="mb-1 text-sm text-stone-600">
              Please complete your payment using the QR code below, then mark your booking as paid from <strong>My Bookings</strong>.
            </p>
            {location.payment_qr_url && (
              <div className="mt-4 inline-block overflow-hidden rounded-xl border border-stone-200 bg-white p-2">
                <img
                  src={location.payment_qr_url}
                  alt="Payment QR Code"
                  className="h-48 w-48 object-contain"
                />
              </div>
            )}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-6 py-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* Price info */}
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-800">
                  PHP {pricePerNight.toLocaleString()} / night
                </p>
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="book-checkin" className={labelClassName}>
                    Check-in <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="book-checkin"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => setCheckIn(e.target.value)}
                    disabled={submitting}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="book-checkout" className={labelClassName}>
                    Check-out <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="book-checkout"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={submitting}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label htmlFor="book-guests" className={labelClassName}>
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  id="book-guests"
                  type="number"
                  min="1"
                  max={location.capacity ?? undefined}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                />
                {location.capacity && (
                  <p className="mt-1 text-xs text-stone-400">Maximum capacity: {location.capacity}</p>
                )}
              </div>

              {/* Total */}
              {nights > 0 && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span>PHP {pricePerNight.toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-stone-900">PHP {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* QR Code Preview */}
              {location.payment_qr_url && (
                <div>
                  <p className="mb-2 text-sm font-medium text-stone-700">Payment QR Code</p>
                  <div className="inline-block overflow-hidden rounded-xl border border-stone-200 bg-white p-2">
                    <img
                      src={location.payment_qr_url}
                      alt="Payment QR Code"
                      className="h-40 w-40 object-contain"
                    />
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    Scan this QR code to pay after submitting your booking.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || nights <= 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Booking...
                  </span>
                ) : (
                  `Book for PHP ${totalPrice.toLocaleString()}`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
