import { Link } from 'react-router-dom'
import type { LocationWithCount } from '../../hooks/useLocations'
import { normalizeAmenities } from '../../lib/utils/amenities'

interface LocationCardProps {
  location: LocationWithCount
}

export function LocationCard({ location }: LocationCardProps) {
  const amenities = normalizeAmenities(location.amenities)

  return (
    <Link
      to={`/locations/${location.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="aspect-video w-full overflow-hidden">
        {location.image_url ? (
          <img
            src={location.image_url}
            alt={location.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-700">
            <span className="text-4xl font-bold text-white/60">
              {location.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 group-hover:text-emerald-700">
            {location.name}
          </h3>
          {location.region && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {location.region}
            </span>
          )}
        </div>
        {location.description && (
          <p className="mb-3 line-clamp-2 text-sm text-stone-500">
            {location.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">
              {location.memberCount} {location.memberCount === 1 ? 'member' : 'members'}
            </span>
            {location.latitude != null && location.longitude != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.928 11.928 0 00.757.433c.113.058.2.098.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                </svg>
                Map
              </a>
            )}
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500"
                >
                  {amenity.name}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-400">
                  +{amenities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
