import type { LocationWithCount } from '../../hooks/useLocations'
import { LocationCard } from './LocationCard'

interface LocationGridProps {
  locations: LocationWithCount[]
  unreadCounts?: Record<string, number>
}

export function LocationGrid({ locations, unreadCounts }: LocationGridProps) {
  if (locations.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-stone-400">No locations found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} unreadCount={unreadCounts?.[location.id]} />
      ))}
    </div>
  )
}
