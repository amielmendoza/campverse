import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAdminLocations, type LocationFormData } from '../hooks/useAdminLocations'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { LocationFormModal } from '../components/admin/LocationFormModal'
import { DeleteConfirmDialog } from '../components/admin/DeleteConfirmDialog'
import type { Location } from '../lib/types'

export function AdminLocationsPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
  } = useAdminLocations()

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            Manage Locations
          </h1>
          <p className="mt-1 text-stone-500">
            Create, edit, and manage all camping locations.
          </p>
        </div>
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
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner size="lg" />}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && locations.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-stone-300 p-12 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
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

      {/* Locations table */}
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
                  <tr
                    key={location.id}
                    className="transition-colors hover:bg-stone-50"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {location.name}
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
                      <div className="flex items-center justify-end gap-2">
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
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(location)}
                          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
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
    </div>
  )
}
