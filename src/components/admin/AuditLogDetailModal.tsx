import type { AuditLogEntry } from '../../hooks/useAuditLog'
import { useFocusTrap } from '../../lib/utils/useFocusTrap'
import { CloseIcon } from '../ui/CloseIcon'

interface AuditLogDetailModalProps {
  entry: AuditLogEntry | null
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
  owner_id: 'Owner',
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'bg-emerald-100 text-emerald-700' },
  updated: { label: 'Updated', color: 'bg-blue-100 text-blue-700' },
  deleted: { label: 'Deleted', color: 'bg-red-100 text-red-700' },
  change_approved: { label: 'Change Approved', color: 'bg-emerald-100 text-emerald-700' },
  change_rejected: { label: 'Change Rejected', color: 'bg-amber-100 text-amber-700' },
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)'
    if (value[0] && typeof value[0] === 'object' && 'name' in value[0]) {
      return value.map((a) => (a as { name: string }).name).join(', ')
    }
    return value.join(', ')
  }
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export function AuditLogDetailModal({ entry, onClose }: AuditLogDetailModalProps) {
  const trapRef = useFocusTrap(!!entry)

  if (!entry) return null

  const actionInfo = ACTION_LABELS[entry.action] ?? { label: entry.action, color: 'bg-stone-100 text-stone-700' }
  const changes = entry.changes

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h2 id="audit-detail-title" className="text-lg font-semibold text-stone-900">
              Audit Entry
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${actionInfo.color}`}>
                {actionInfo.label}
              </span>
              <span>&middot;</span>
              <span className="font-medium text-stone-700">{entry.location_name}</span>
              <span>&middot;</span>
              <span>
                {new Date(entry.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}{' '}
                {new Date(entry.created_at).toLocaleTimeString(undefined, {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <p className="mb-4 text-sm text-stone-500">
            By <span className="font-medium text-stone-700">{entry.actor_name}</span>
          </p>

          {/* Created: show all initial values */}
          {entry.action === 'created' && changes && (
            <div className="space-y-3">
              {Object.entries(changes).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-stone-200 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {FIELD_LABELS[key] || key}
                  </p>
                  <p className="text-sm text-stone-700">{formatValue(val)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Updated: show before/after */}
          {entry.action === 'updated' && changes && (
            <div className="space-y-3">
              {Object.keys((changes as Record<string, unknown>).before as Record<string, unknown> ?? {}).map((key) => {
                const before = ((changes as Record<string, unknown>).before as Record<string, unknown>)[key]
                const after = ((changes as Record<string, unknown>).after as Record<string, unknown>)[key]
                return (
                  <div key={key} className="rounded-lg border border-stone-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {FIELD_LABELS[key] || key}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-400">Before</p>
                        <p className="rounded bg-red-50 px-3 py-2 text-sm text-stone-700">
                          {formatValue(before)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-400">After</p>
                        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-stone-700">
                          {formatValue(after)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Change approved: show before/after diff */}
          {entry.action === 'change_approved' && changes && (() => {
            const c = changes as Record<string, unknown>
            // Support both new format { before, after } and legacy { applied, original }
            const afterData = (c.after ?? c.applied) as Record<string, unknown> | undefined
            const beforeData = (c.before ?? {}) as Record<string, unknown>

            if (!afterData || Object.keys(afterData).length === 0) {
              return <p className="text-sm text-stone-500">No change details recorded.</p>
            }

            return (
              <div className="space-y-3">
                {Object.keys(afterData).map((key) => (
                  <div key={key} className="rounded-lg border border-stone-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {FIELD_LABELS[key] || key}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-400">Before</p>
                        <p className="rounded bg-red-50 px-3 py-2 text-sm text-stone-700">
                          {formatValue(beforeData[key])}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-stone-400">After</p>
                        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-stone-700">
                          {formatValue(afterData[key])}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Change rejected: show proposed + reason */}
          {entry.action === 'change_rejected' && changes && (
            <div className="space-y-3">
              {!!(changes as Record<string, unknown>).reason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">
                    {String((changes as Record<string, unknown>).reason)}
                  </p>
                </div>
              )}
              <p className="text-xs font-medium uppercase text-stone-400">Proposed Changes</p>
              {Object.entries((changes as Record<string, unknown>).proposed as Record<string, unknown> ?? {}).map(
                ([key, val]) => (
                  <div key={key} className="rounded-lg border border-stone-200 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {FIELD_LABELS[key] || key}
                    </p>
                    <p className="rounded bg-amber-50 px-3 py-2 text-sm text-stone-700">
                      {formatValue(val)}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Deleted: just a message */}
          {entry.action === 'deleted' && (
            <p className="text-sm text-stone-600">
              Location <span className="font-medium">{entry.location_name}</span> was deleted.
            </p>
          )}

          {/* No changes data */}
          {!changes && entry.action !== 'deleted' && (
            <p className="text-sm text-stone-500">No change details recorded.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-stone-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
