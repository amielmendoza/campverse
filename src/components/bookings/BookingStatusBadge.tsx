import type { BookingStatus } from '../../lib/types'

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: {
    label: 'Pending Payment',
    className: 'bg-amber-100 text-amber-800',
  },
  pending_confirmation: {
    label: 'Awaiting Confirmation',
    className: 'bg-blue-100 text-blue-800',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-100 text-emerald-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-stone-100 text-stone-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-stone-100 text-stone-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
