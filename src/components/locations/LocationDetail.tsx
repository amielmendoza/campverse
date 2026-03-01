import { useCallback, useEffect, useState } from 'react'
import type { LocationWithCount } from '../../hooks/useLocations'
import type { AmenityItem } from '../../lib/types'
import { normalizeAmenities, normalizeGallery } from '../../lib/utils/amenities'
import { CloseIcon } from '../ui/CloseIcon'

interface LocationDetailProps {
  location: LocationWithCount
  isMember: boolean
  onJoin: () => void
  onLeave: () => void
  loading: boolean
}

interface LightboxImage {
  src: string
  label: string
}

// Amenity icon mapping
function AmenityIcon({ name }: { name: string }) {
  const n = name.toLowerCase()
  if (n.includes('wifi') || n.includes('internet'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
      </svg>
    )
  if (n.includes('shower') || n.includes('bath'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    )
  if (n.includes('parking'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.094-.468 1.04-1.085l-.506-5.593A2.25 2.25 0 0 0 18.485 9H15.75m-7.5 0v3.75m7.5-3.75h-7.5m7.5 0 .342-2.052A1.125 1.125 0 0 0 14.979 6H9.021a1.125 1.125 0 0 0-1.113.948L7.575 9" />
      </svg>
    )
  if (n.includes('fire') || n.includes('campfire') || n.includes('bbq') || n.includes('grill'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    )
  if (n.includes('water') || n.includes('drink'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-4.97 7.5-7.5 10.5-7.5 14.25a7.5 7.5 0 0 0 15 0c0-3.75-2.53-6.75-7.5-14.25Z" />
      </svg>
    )
  if (n.includes('electric') || n.includes('power'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    )
  if (n.includes('toilet') || n.includes('restroom'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    )
  if (n.includes('pool') || n.includes('swim'))
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20.25c1.5 0 2.25-.75 3-1.5s1.5-1.5 3-1.5 2.25.75 3 1.5 1.5 1.5 3 1.5 2.25-.75 3-1.5 1.5-1.5 3-1.5m-18-3c1.5 0 2.25-.75 3-1.5s1.5-1.5 3-1.5 2.25.75 3 1.5 1.5 1.5 3 1.5 2.25-.75 3-1.5 1.5-1.5 3-1.5" />
      </svg>
    )
  // Default amenity icon
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}

export function LocationDetail({
  location,
  isMember,
  onJoin,
  onLeave,
  loading,
}: LocationDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAllAmenities, setShowAllAmenities] = useState(false)

  const amenities: AmenityItem[] = normalizeAmenities(location.amenities)
  const gallery: string[] = normalizeGallery(location.gallery)

  // Build unified lightbox list: hero first, then gallery photos, then amenity images
  const lightboxImages: LightboxImage[] = [
    ...(location.image_url ? [{ src: location.image_url, label: location.name }] : []),
    ...gallery.map((url, i) => ({ src: url, label: `Photo ${i + 1}` })),
    ...amenities.filter((a) => a.image_url).map((a) => ({ src: a.image_url, label: a.name })),
  ]

  const heroOffset = location.image_url ? 1 : 0

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex === 0 ? lightboxImages.length - 1 : lightboxIndex - 1)
  }, [lightboxIndex, lightboxImages.length])

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex === lightboxImages.length - 1 ? 0 : lightboxIndex + 1)
  }, [lightboxIndex, lightboxImages.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, goPrev, goNext])

  const currentImage = lightboxIndex !== null ? lightboxImages[lightboxIndex] : null

  // Airbnb-style photo grid: 1 large left + up to 4 small right
  const gridPhotos = [
    location.image_url,
    ...gallery,
  ].filter(Boolean) as string[]

  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 10)

  // Parse rules into lines for display
  const rulesLines = location.rules
    ? location.rules.split('\n').filter((line) => line.trim())
    : []

  return (
    <>
      {/* ── Photo Grid (Airbnb-style) ── */}
      {gridPhotos.length > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-xl">
          {gridPhotos.length === 1 ? (
            /* Single photo — full width */
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="block h-[340px] w-full cursor-pointer overflow-hidden sm:h-[420px]"
            >
              <img src={gridPhotos[0]} alt={location.name} className="h-full w-full object-cover" />
            </button>
          ) : gridPhotos.length === 2 ? (
            /* Two photos — 50/50 */
            <div className="grid h-[340px] grid-cols-2 gap-1.5 sm:h-[420px]">
              {gridPhotos.slice(0, 2).map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="cursor-pointer overflow-hidden"
                >
                  <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover transition-opacity hover:opacity-90" />
                </button>
              ))}
            </div>
          ) : (
            /* 3+ photos — Airbnb grid: 1 large left, up to 4 small right */
            <div className="grid h-[340px] grid-cols-1 gap-1.5 sm:h-[420px] md:grid-cols-2">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="cursor-pointer overflow-hidden"
              >
                <img
                  src={gridPhotos[0]}
                  alt={location.name}
                  className="h-full w-full object-cover transition-opacity hover:opacity-90"
                />
              </button>
              <div className="hidden grid-cols-2 grid-rows-2 gap-1.5 md:grid">
                {gridPhotos.slice(1, 5).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="cursor-pointer overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 2}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show all photos button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-md transition-transform hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              Show all photos
            </button>
          )}
        </div>
      )}

      {/* ── Main Content: Two-Column Layout ── */}
      <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-3">
        {/* Left Column — Details */}
        <div className="lg:col-span-2">
          {/* Title & Location Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              {location.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
              {location.region && (
                <>
                  <span>{location.region}</span>
                  <span aria-hidden="true">&middot;</span>
                </>
              )}
              <span>{location.memberCount} {location.memberCount === 1 ? 'member' : 'members'}</span>
              {location.capacity && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>Up to {location.capacity} guests</span>
                </>
              )}
            </div>
          </div>

          <hr className="mb-6 border-stone-200" />

          {/* Highlights Row */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {location.latitude != null && location.longitude != null && (
              <div className="flex items-start gap-4">
                <svg className="mt-0.5 h-7 w-7 shrink-0 text-stone-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-stone-900">Great location</p>
                  <p className="text-xs text-stone-500">GPS coordinates available</p>
                </div>
              </div>
            )}
            {amenities.length > 0 && (
              <div className="flex items-start gap-4">
                <svg className="mt-0.5 h-7 w-7 shrink-0 text-stone-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-stone-900">{amenities.length} amenities</p>
                  <p className="text-xs text-stone-500">Well-equipped campsite</p>
                </div>
              </div>
            )}
            {location.memberCount > 0 && (
              <div className="flex items-start gap-4">
                <svg className="mt-0.5 h-7 w-7 shrink-0 text-stone-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-stone-900">Active community</p>
                  <p className="text-xs text-stone-500">{location.memberCount} campers joined</p>
                </div>
              </div>
            )}
          </div>

          <hr className="mb-6 border-stone-200" />

          {/* Description */}
          {location.description && (
            <>
              <div className="mb-6">
                <h2 className="mb-3 text-xl font-semibold text-stone-900">About this place</h2>
                <p className="text-base leading-relaxed text-stone-600">
                  {location.description}
                </p>
              </div>
              <hr className="mb-6 border-stone-200" />
            </>
          )}

          {/* Amenities Section */}
          {amenities.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold text-stone-900">What this place offers</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleAmenities.map((amenity, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (amenity.image_url) {
                          const amenitiesWithImages = amenities.filter((a) => a.image_url)
                          const amenityIdx = amenitiesWithImages.findIndex((a) => a === amenity)
                          if (amenityIdx !== -1) setLightboxIndex(heroOffset + gallery.length + amenityIdx)
                        }
                      }}
                      className={`flex items-center gap-4 rounded-lg py-3 text-left ${amenity.image_url ? 'cursor-pointer transition-colors hover:bg-stone-50' : ''}`}
                    >
                      {amenity.image_url ? (
                        <img
                          src={amenity.image_url}
                          alt={amenity.name}
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-stone-600">
                          <AmenityIcon name={amenity.name} />
                        </span>
                      )}
                      <span className="text-sm text-stone-700">{amenity.name}</span>
                    </button>
                  ))}
                </div>
                {amenities.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="mt-4 cursor-pointer rounded-lg border border-stone-900 px-6 py-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50"
                  >
                    {showAllAmenities ? 'Show less' : `Show all ${amenities.length} amenities`}
                  </button>
                )}
              </div>
              <hr className="mb-6 border-stone-200" />
            </>
          )}

          {/* Rules Section */}
          {rulesLines.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="mb-4 text-xl font-semibold text-stone-900">Things to know</h2>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-stone-900">Camp rules</h3>
                  <ul className="space-y-2">
                    {rulesLines.map((line, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-stone-600">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                        {line.replace(/^[-•]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <hr className="mb-6 border-stone-200" />
            </>
          )}

          {/* Map Section */}
          {location.latitude != null && location.longitude != null && (
            <div className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-stone-900">Where you'll be</h2>
              {location.region && (
                <p className="mb-3 text-sm text-stone-500">{location.region}</p>
              )}
              <div className="relative overflow-hidden rounded-xl">
                <iframe
                  title={`Map of ${location.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.03},${location.latitude - 0.02},${location.longitude + 0.03},${location.latitude + 0.02}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                  className="h-[280px] w-full border-0 sm:h-[320px]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {/* Google Maps overlay link */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-stone-800 shadow-md transition-colors hover:bg-stone-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Sticky Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-stone-200 bg-white p-6 shadow-lg">
            <div className="mb-4">
              <span className="text-xl font-semibold text-stone-900">{location.name}</span>
              {location.region && (
                <p className="mt-1 text-sm text-stone-500">{location.region}</p>
              )}
            </div>

            <hr className="mb-4 border-stone-200" />

            <div className="mb-4 space-y-3 text-sm text-stone-600">
              <div className="flex items-center justify-between">
                <span>Members</span>
                <span className="font-medium text-stone-900">{location.memberCount}</span>
              </div>
              {location.capacity && (
                <div className="flex items-center justify-between">
                  <span>Capacity</span>
                  <span className="font-medium text-stone-900">{location.capacity}</span>
                </div>
              )}
              {amenities.length > 0 && (
                <div className="flex items-center justify-between">
                  <span>Amenities</span>
                  <span className="font-medium text-stone-900">{amenities.length}</span>
                </div>
              )}
            </div>

            <button
              onClick={isMember ? onLeave : onJoin}
              disabled={loading}
              className={`w-full cursor-pointer rounded-lg px-5 py-3 text-base font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isMember
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
              }`}
            >
              {loading ? 'Loading...' : isMember ? 'Leave this camp' : 'Join this camp'}
            </button>

            {!isMember && (
              <p className="mt-3 text-center text-xs text-stone-400">
                Join to access the community chat
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox Modal ── */}
      {currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-label"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 z-10 -translate-x-1/2 text-sm font-medium text-white/80">
            {lightboxIndex! + 1} / {lightboxImages.length}
          </div>

          {/* Prev button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 z-10 rounded-full bg-white p-3 text-stone-800 shadow-lg transition-transform hover:scale-110"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="max-h-[85vh] max-w-5xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.src.replace(/\?w=\d+/, '')}
              alt={currentImage.label}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            <p id="lightbox-label" className="mt-3 text-center text-sm font-medium text-white/80">
              {currentImage.label}
            </p>
          </div>

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-4 z-10 rounded-full bg-white p-3 text-stone-800 shadow-lg transition-transform hover:scale-110"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  )
}
