import { useMemo, useState } from 'react'
import { useLocations } from '../hooks/useLocations'
import { LocationGrid } from '../components/locations/LocationGrid'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function LocationsPage() {
  const { locations, unreadCounts, loading, error } = useLocations()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return locations
    const q = search.toLowerCase()
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.region?.toLowerCase().includes(q),
    )
  }, [locations, search])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
          Explore Camping Locations
        </h1>
        <p className="mt-1 text-stone-500">
          Discover and join camping communities near you.
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or region..."
          className="w-full max-w-md rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-800 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {loading && <LoadingSpinner size="lg" />}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && <LocationGrid locations={filtered} unreadCounts={unreadCounts} />}
    </div>
  )
}
