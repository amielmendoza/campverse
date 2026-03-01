import { useState, type FormEvent } from 'react'
import type { Location, RateOption, RateSelection } from '../../lib/types'
import { inputClassName, labelClassName } from '../../lib/utils/styles'
import { useFocusTrap } from '../../lib/utils/useFocusTrap'
import { CloseIcon } from '../ui/CloseIcon'
import { ReceiptUpload } from './ReceiptUpload'

interface BookingFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (checkIn: string, checkOut: string, guests: number, totalPrice: number, rateSelections: RateSelection[]) => Promise<string>
  onMarkPaid: (bookingId: string, receiptUrl: string) => Promise<void>
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

function getRateOptions(location: Location): RateOption[] {
  if (location.rate_options && Array.isArray(location.rate_options) && location.rate_options.length > 0) {
    return location.rate_options as unknown as RateOption[]
  }
  // Legacy fallback
  if (location.price_per_night != null) {
    return [{ label: 'Per Night', price: location.price_per_night, per: 'night' as const }]
  }
  return []
}

type Step = 'form' | 'payment' | 'done'

export function BookingFormModal({ isOpen, onClose, onSubmit, onMarkPaid, location }: BookingFormModalProps) {
  const trapRef = useFocusTrap(isOpen)
  const today = getTodayStr()

  const rateOptions = getRateOptions(location)

  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('1')
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('form')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)

  const nights = getNights(checkIn, checkOut)

  // Compute total from rate selections
  const selections: RateSelection[] = rateOptions
    .map((opt, i) => ({ ...opt, quantity: quantities[i] || 0 }))
    .filter((s) => s.quantity > 0)

  const totalPrice = selections.reduce((sum, s) => {
    const multiplier = s.per === 'night' ? nights : 1
    return sum + s.price * s.quantity * multiplier
  }, 0)

  function setQuantity(index: number, value: number) {
    setQuantities((prev) => ({ ...prev, [index]: Math.max(0, value) }))
  }

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
    if (selections.length === 0) {
      setError('Please select at least one rate option.')
      return
    }

    setSubmitting(true)
    try {
      const id = await onSubmit(checkIn, checkOut, guestCount, totalPrice, selections)
      setBookingId(id)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitPayment() {
    if (!bookingId || !receiptUrl) return
    setSubmitting(true)
    setError(null)
    try {
      await onMarkPaid(bookingId, receiptUrl)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setStep('form')
    setError(null)
    setCheckIn(today)
    setCheckOut('')
    setGuests('1')
    setQuantities({})
    setBookingId(null)
    setReceiptUrl(null)
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
            {step === 'form' && `Book ${location.name}`}
            {step === 'payment' && 'Complete Payment'}
            {step === 'done' && 'Booking Confirmed'}
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

        {step === 'done' ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-stone-900">Payment Submitted!</h3>
            <p className="text-sm text-stone-600">
              Your booking and payment receipt have been submitted. The owner will review and confirm your booking shortly.
            </p>
            <p className="mt-2 text-xs text-stone-400">
              You can track your booking status from <strong>My Bookings</strong>.
            </p>
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
        ) : step === 'payment' ? (
          <div>
            <div className="space-y-4 px-6 py-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* Summary */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="space-y-1 text-sm text-stone-600">
                  {selections.map((s, i) => {
                    const multiplier = s.per === 'night' ? nights : 1
                    const lineTotal = s.price * s.quantity * multiplier
                    return (
                      <div key={i} className="flex justify-between">
                        <span>{s.label} x {s.quantity}{s.per === 'night' ? ` x ${nights} night${nights > 1 ? 's' : ''}` : ''}</span>
                        <span>PHP {lineTotal.toLocaleString()}</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between border-t border-stone-300 pt-1 font-semibold text-stone-900">
                    <span>Total</span>
                    <span>PHP {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {location.payment_qr_url && (
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium text-stone-700">Scan to pay</p>
                  <div className="inline-block overflow-hidden rounded-xl border border-stone-200 bg-white p-2">
                    <img
                      src={location.payment_qr_url}
                      alt="Payment QR Code"
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Receipt upload */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-2 text-sm font-medium text-emerald-800">Upload your payment receipt</p>
                <p className="mb-3 text-xs text-emerald-600">
                  After paying, take a screenshot of your receipt and upload it below.
                </p>
                {bookingId && (
                  <ReceiptUpload
                    bookingId={bookingId}
                    onUploaded={setReceiptUrl}
                    disabled={submitting}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={submitting || !receiptUrl}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Payment'
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 px-6 py-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

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

              {/* Rate options */}
              <div>
                <label className={labelClassName}>Select Rates</label>
                <div className="space-y-2">
                  {rateOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                        <p className="text-xs text-stone-500">
                          PHP {opt.price.toLocaleString()} / {opt.per}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quantities[i] || ''}
                        onChange={(e) => setQuantity(i, parseInt(e.target.value, 10) || 0)}
                        disabled={submitting}
                        className="w-20 rounded-lg border border-stone-300 px-3 py-1.5 text-center text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              {totalPrice > 0 && nights > 0 && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="space-y-1 text-sm text-stone-600">
                    {selections.map((s, i) => {
                      const multiplier = s.per === 'night' ? nights : 1
                      const lineTotal = s.price * s.quantity * multiplier
                      return (
                        <div key={i} className="flex justify-between">
                          <span>{s.label} x {s.quantity}{s.per === 'night' ? ` x ${nights} night${nights > 1 ? 's' : ''}` : ''}</span>
                          <span>PHP {lineTotal.toLocaleString()}</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between border-t border-stone-300 pt-1 font-semibold text-stone-900">
                      <span>Total</span>
                      <span>PHP {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
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
                disabled={submitting || nights <= 0 || selections.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Booking...
                  </span>
                ) : (
                  `Proceed to Payment — PHP ${totalPrice.toLocaleString()}`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
