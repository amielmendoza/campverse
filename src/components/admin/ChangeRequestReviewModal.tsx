import { useEffect, useState } from 'react'
import type { ChangeRequestWithDetails } from '../../hooks/useChangeRequests'
import { useFocusTrap } from '../../lib/utils/useFocusTrap'
import { CloseIcon } from '../ui/CloseIcon'

interface ChangeRequestReviewModalProps {
  request: ChangeRequestWithDetails | null
  currentLocationData: Record<string, unknown> | null
  onApprove: (id: string, editedChanges?: Record<string, unknown>) => Promise<void>
  onReject: (id: string, note?: string) => Promise<void>
  onClose: () => void
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  slug: 'Slug',
  description: 'Description',
  image_url: 'Image URL',
  latitude: 'Latitude',
  longitude: 'Longitude',
  region: 'Region',
  capacity: 'Capacity',
  rules: 'Rules & Guidelines',
  is_active: 'Active',
  amenities: 'Amenities',
  gallery: 'Gallery',
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)'
    // Check if amenities array
    if (value[0] && typeof value[0] === 'object' && 'name' in value[0]) {
      return value.map((a) => (a as { name: string }).name).join(', ')
    }
    return value.join(', ')
  }
  return String(value)
}

// Fields that use textarea for editing
const TEXTAREA_FIELDS = new Set(['description', 'rules'])
// Fields that are boolean toggles
const BOOLEAN_FIELDS = new Set(['is_active'])
// Fields that are numeric
const NUMBER_FIELDS = new Set(['latitude', 'longitude', 'capacity'])
// Fields that are complex (arrays/objects) — shown as JSON
const COMPLEX_FIELDS = new Set(['amenities', 'gallery'])

function renderEditableInput(
  field: string,
  value: unknown,
  onChange: (field: string, value: unknown) => void,
) {
  if (BOOLEAN_FIELDS.has(field)) {
    return (
      <button
        type="button"
        onClick={() => onChange(field, !value)}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          value
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </button>
    )
  }

  if (COMPLEX_FIELDS.has(field)) {
    return (
      <textarea
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            onChange(field, JSON.parse(e.target.value))
          } catch {
            // Don't update if JSON is invalid — user is still typing
          }
        }}
        rows={4}
        className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-mono text-xs text-stone-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
    )
  }

  if (TEXTAREA_FIELDS.has(field)) {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(field, e.target.value || null)}
        rows={3}
        className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-stone-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
    )
  }

  if (NUMBER_FIELDS.has(field)) {
    return (
      <input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => {
          const v = e.target.value
          onChange(field, v === '' ? null : Number(v))
        }}
        step={field === 'latitude' || field === 'longitude' ? 'any' : '1'}
        className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-stone-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
      />
    )
  }

  // Default: text input
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(field, e.target.value || null)}
      className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-stone-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
    />
  )
}

export function ChangeRequestReviewModal({
  request,
  currentLocationData,
  onApprove,
  onReject,
  onClose,
}: ChangeRequestReviewModalProps) {
  const trapRef = useFocusTrap(!!request)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedChanges, setEditedChanges] = useState<Record<string, unknown>>({})

  // Reset edited changes when the request changes
  useEffect(() => {
    if (request) {
      setEditedChanges({ ...request.changes })
    }
  }, [request])

  if (!request || !currentLocationData) return null

  const changedFields = Object.keys(request.changes)

  function handleFieldChange(field: string, value: unknown) {
    setEditedChanges((prev) => ({ ...prev, [field]: value }))
  }

  // Check if admin has modified any proposed values
  const hasEdits = changedFields.some(
    (field) => JSON.stringify(editedChanges[field]) !== JSON.stringify(request.changes[field]),
  )

  async function handleApprove() {
    if (!request) return
    setProcessing(true)
    setError(null)
    try {
      // Only pass editedChanges if admin actually made edits
      await onApprove(request.id, hasEdits ? editedChanges : undefined)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!request) return
    setProcessing(true)
    setError(null)
    try {
      await onReject(request.id, rejectNote.trim() || undefined)
      setRejectNote('')
      setShowRejectForm(false)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={processing ? undefined : onClose} />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 id="review-modal-title" className="text-lg font-semibold text-stone-900">
              Review Changes
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              {request.location_name} &middot; Submitted by {request.submitter_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {changedFields.map((field) => {
              const currentVal = currentLocationData[field]
              const proposedVal = request.changes[field]
              const hasChanged = JSON.stringify(currentVal) !== JSON.stringify(proposedVal)

              if (!hasChanged) return null

              const editedVal = editedChanges[field]
              const isEdited = JSON.stringify(editedVal) !== JSON.stringify(proposedVal)

              return (
                <div key={field} className="rounded-lg border border-stone-200 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {FIELD_LABELS[field] || field}
                    </p>
                    {isEdited && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        Edited
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs font-medium text-stone-400">Current</p>
                      <p className="rounded bg-red-50 px-3 py-2 text-sm text-stone-700">
                        {formatValue(currentVal)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-stone-400">
                        Proposed {isEdited && <span className="text-blue-500">(modified)</span>}
                      </p>
                      {renderEditableInput(field, editedVal ?? proposedVal, handleFieldChange)}
                    </div>
                  </div>
                </div>
              )
            })}

            {changedFields.every(
              (field) =>
                JSON.stringify(currentLocationData[field]) === JSON.stringify(request.changes[field]),
            ) && (
              <p className="py-4 text-center text-sm text-stone-500">
                No differences found — the current data already matches the proposed changes.
              </p>
            )}
          </div>

          {/* Reject reason form */}
          {showRejectForm && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <label className="mb-1 block text-sm font-medium text-red-700">
                Rejection reason (optional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                placeholder="Explain why the changes were rejected..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4">
          {showRejectForm ? (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                disabled={processing}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={processing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={processing}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {processing ? 'Approving...' : hasEdits ? 'Approve with Edits' : 'Approve Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
