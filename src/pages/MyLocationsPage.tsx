import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOwnerLocations } from '../hooks/useOwnerLocations'
import { LocationFormModal } from '../components/admin/LocationFormModal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { LocationFormData } from '../hooks/useAdminLocations'
import type { Location } from '../lib/types'

export function MyLocationsPage() {
  const { locations, pendingRequests, loading, error, submitChangeRequest } = useOwnerLocations()

  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        <Link
          to="/my-locations/bookings"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          View Bookings
        </Link>
      </div>

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
            You don't own any locations yet. An admin can assign you as the owner of a location.
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
    </div>
  )
}
