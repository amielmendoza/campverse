import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAdminLocations, type LocationFormData } from '../hooks/useAdminLocations'
import { useChangeRequests, type ChangeRequestWithDetails } from '../hooks/useChangeRequests'
import { useAuditLog, type AuditLogEntry } from '../hooks/useAuditLog'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { LocationFormModal } from '../components/admin/LocationFormModal'
import { DeleteConfirmDialog } from '../components/admin/DeleteConfirmDialog'
import { ChangeRequestReviewModal } from '../components/admin/ChangeRequestReviewModal'
import { AuditLogDetailModal } from '../components/admin/AuditLogDetailModal'
import type { Location } from '../lib/types'

type Tab = 'locations' | 'approvals' | 'audit'

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'bg-emerald-100 text-emerald-700' },
  updated: { label: 'Updated', color: 'bg-blue-100 text-blue-700' },
  deleted: { label: 'Deleted', color: 'bg-red-100 text-red-700' },
  change_approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  change_rejected: { label: 'Rejected', color: 'bg-amber-100 text-amber-700' },
}

export function AdminLocationsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch: refetchLocations,
  } = useAdminLocations()

  const {
    requests: pendingRequests,
    loading: requestsLoading,
    error: requestsError,
    approveRequest,
    rejectRequest,
    refetch: refetchRequests,
  } = useChangeRequests()

  const {
    entries: auditEntries,
    loading: auditLoading,
    error: auditError,
    hasMore: auditHasMore,
    loadMore: auditLoadMore,
    refetch: refetchAudit,
  } = useAuditLog()

  const [activeTab, setActiveTab] = useState<Tab>('locations')

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    if (tab === 'locations') refetchLocations()
    else if (tab === 'approvals') refetchRequests()
    else if (tab === 'audit') refetchAudit()
  }

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  // Review modal state
  const [reviewingRequest, setReviewingRequest] = useState<ChangeRequestWithDetails | null>(null)
  const [reviewLocationData, setReviewLocationData] = useState<Record<string, unknown> | null>(null)

  // Audit detail modal state
  const [auditDetail, setAuditDetail] = useState<AuditLogEntry | null>(null)

  // Guard: redirect non-admins
  if (!authLoading && !isAdmin) {
    return <Navigate to="/locations" replace />
  }

  function handleAdd() {
    setEditingLocation(null)
    setFormOpen(true)
  }

  function handleEdit(location: Location) {
    setEditingLocation(location)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingLocation(null)
  }

  async function handleFormSubmit(data: LocationFormData) {
    if (editingLocation) {
      await updateLocation(editingLocation.id, data)
    } else {
      await createLocation(data)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await deleteLocation(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleReview(request: ChangeRequestWithDetails) {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', request.location_id)
      .single()

    setReviewLocationData(data as unknown as Record<string, unknown>)
    setReviewingRequest(request)
  }

  const FIELD_LABELS: Record<string, string> = {
    name: 'Name', slug: 'Slug', description: 'Description',
    image_url: 'Image', latitude: 'Latitude', longitude: 'Longitude',
    region: 'Region', capacity: 'Capacity', rules: 'Rules',
    is_active: 'Status', amenities: 'Amenities', gallery: 'Gallery',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            Admin
          </h1>
          <p className="mt-1 text-stone-500">
            Manage locations and review owner change requests.
          </p>
        </div>
        {activeTab === 'locations' && (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Location
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => switchTab('locations')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'locations'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Locations
        </button>
        <button
          type="button"
          onClick={() => switchTab('approvals')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'approvals'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Approvals
          {pendingRequests.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => switchTab('audit')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* ── Locations Tab ── */}
      {activeTab === 'locations' && (
        <>
          {loading && <LoadingSpinner size="lg" />}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
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
              <h3 className="mb-1 text-lg font-semibold text-stone-700">No locations yet</h3>
              <p className="mb-4 text-sm text-stone-500">
                Get started by adding your first camping location.
              </p>
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Location
              </button>
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
                    {locations.map((location) => (
                      <tr key={location.id} className="transition-colors hover:bg-stone-50">
                        <td className="px-4 py-3 font-medium text-stone-900">{location.name}</td>
                        <td className="px-4 py-3 text-stone-600">{location.region || '\u2014'}</td>
                        <td className="px-4 py-3">
                          {location.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-600">{location.capacity ?? '\u2014'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(location)}
                              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-emerald-600"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(location)}
                              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Approvals Tab ── */}
      {activeTab === 'approvals' && (
        <>
          {requestsLoading && <LoadingSpinner size="lg" />}

          {requestsError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{requestsError}</div>
          )}

          {!requestsLoading && !requestsError && pendingRequests.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-stone-300 p-12 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-stone-700">All caught up!</h3>
              <p className="text-sm text-stone-500">No pending change requests to review.</p>
            </div>
          )}

          {!requestsLoading && !requestsError && pendingRequests.length > 0 && (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const fieldNames = Object.keys(request.changes).map(
                  (f) => FIELD_LABELS[f] || f,
                )

                return (
                  <div
                    key={request.id}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-stone-900">
                            {request.location_name}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          Submitted by{' '}
                          <span className="font-medium text-stone-700">{request.submitter_name}</span>
                          {' '}&middot;{' '}
                          {new Date(request.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                          {' '}at{' '}
                          {new Date(request.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {fieldNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReview(request)}
                        className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Audit Log Tab ── */}
      {activeTab === 'audit' && (
        <>
          {auditLoading && auditEntries.length === 0 && <LoadingSpinner size="lg" />}

          {auditError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{auditError}</div>
          )}

          {!auditLoading && !auditError && auditEntries.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-stone-300 p-12 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h3 className="mb-1 text-lg font-semibold text-stone-700">No audit entries yet</h3>
              <p className="text-sm text-stone-500">Changes will appear here once actions are taken.</p>
            </div>
          )}

          {auditEntries.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-3 font-semibold text-stone-600">Time</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">Location</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">Action</th>
                      <th className="px-4 py-3 font-semibold text-stone-600">By</th>
                      <th className="px-4 py-3 text-right font-semibold text-stone-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditEntries.map((entry) => {
                      const badge = ACTION_BADGES[entry.action] ?? { label: entry.action, color: 'bg-stone-100 text-stone-600' }
                      return (
                        <tr key={entry.id} className="transition-colors hover:bg-stone-50">
                          <td className="whitespace-nowrap px-4 py-3 text-stone-500">
                            {new Date(entry.created_at).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric',
                            })}{' '}
                            {new Date(entry.created_at).toLocaleTimeString(undefined, {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium text-stone-900">{entry.location_name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-600">{entry.actor_name}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setAuditDetail(entry)}
                              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                              title="View details"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {auditHasMore && (
                <div className="border-t border-stone-200 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={auditLoadMore}
                    disabled={auditLoading}
                    className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50"
                  >
                    {auditLoading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      <LocationFormModal
        isOpen={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingLocation}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        locationName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Change request review modal */}
      <ChangeRequestReviewModal
        request={reviewingRequest}
        currentLocationData={reviewLocationData}
        onApprove={approveRequest}
        onReject={rejectRequest}
        onClose={() => {
          setReviewingRequest(null)
          setReviewLocationData(null)
        }}
      />

      {/* Audit log detail modal */}
      <AuditLogDetailModal
        entry={auditDetail}
        onClose={() => setAuditDetail(null)}
      />
    </div>
  )
}
