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

export function LocationDetail({
  location,
  isMember,
  onJoin,
  onLeave,
  loading,
}: LocationDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const amenities: AmenityItem[] = normalizeAmenities(location.amenities)
  const gallery: string[] = normalizeGallery(location.gallery)

  // Build unified lightbox list: gallery photos first, then amenity images
  const lightboxImages: LightboxImage[] = [
    ...gallery.map((url, i) => ({ src: url, label: `Photo ${i + 1}` })),
    ...amenities.filter((a) => a.image_url).map((a) => ({ src: a.image_url, label: a.name })),
  ]

  const galleryCount = gallery.length

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

  function openGalleryLightbox(galleryIdx: number) {
    setLightboxIndex(galleryIdx)
  }

  function openAmenityLightbox(amenity: AmenityItem) {
    const amenitiesWithImages = amenities.filter((a) => a.image_url)
    const amenityIdx = amenitiesWithImages.findIndex((a) => a === amenity)
    if (amenityIdx !== -1) setLightboxIndex(galleryCount + amenityIdx)
  }

  const currentImage = lightboxIndex !== null ? lightboxImages[lightboxIndex] : null

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Hero image — clickable if gallery exists */}
      {location.image_url ? (
        <button
          type="button"
          onClick={() => gallery.length > 0 ? openGalleryLightbox(0) : undefined}
          className={`relative h-48 w-full overflow-hidden sm:h-64 ${gallery.length > 0 ? 'cursor-pointer' : ''}`}
        >
          <img
            src={location.image_url}
            alt={location.name}
            className="h-full w-full object-cover"
          />
          {gallery.length > 0 && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              {gallery.length + 1} photos
            </span>
          )}
        </button>
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-700 sm:h-64">
          <span className="text-6xl font-bold text-white/40">
            {location.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Gallery thumbnails */}
      {gallery.length > 0 && (
        <div className="flex gap-1 overflow-x-auto bg-stone-100 p-1">
          {gallery.map((url, index) => (
            <button
              key={index}
              type="button"
              onClick={() => openGalleryLightbox(index)}
              className="h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md sm:h-20 sm:w-24"
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity hover:opacity-80"
              />
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
              {location.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {location.region && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {location.region}
                </span>
              )}
              <span className="text-sm text-stone-400">
                {location.memberCount} {location.memberCount === 1 ? 'member' : 'members'}
              </span>
              {location.capacity && (
                <span className="text-sm text-stone-400">
                  Capacity: {location.capacity}
                </span>
              )}
              {location.latitude != null && location.longitude != null && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.928 11.928 0 00.757.433c.113.058.2.098.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                  </svg>
                  View on Map
                </a>
              )}
            </div>
          </div>
          <button
            onClick={isMember ? onLeave : onJoin}
            disabled={loading}
            className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isMember
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? '...' : isMember ? 'Leave' : 'Join'}
          </button>
        </div>

        {location.description && (
          <p className="mb-4 leading-relaxed text-stone-600">
            {location.description}
          </p>
        )}

        {/* Amenities section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-stone-700">
            Amenities
          </h3>
          {amenities.length === 0 ? (
            <p className="text-sm text-stone-400">No amenities listed</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="w-[120px] shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-stone-200"
                >
                  {amenity.image_url ? (
                    <button
                      type="button"
                      onClick={() => openAmenityLightbox(amenity)}
                      className="h-20 w-full cursor-pointer overflow-hidden"
                    >
                      <img
                        src={amenity.image_url}
                        alt={amenity.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
                      />
                    </button>
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-300">
                      <span className="text-2xl font-bold text-emerald-600/40">
                        {amenity.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="px-2 py-1.5">
                    <p className="truncate text-center text-xs font-medium text-stone-700">
                      {amenity.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox modal */}
      {currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-label"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
          >
            <CloseIcon className="h-6 w-6" />
          </button>

          {/* Prev button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              className="absolute left-4 z-10 rounded-full bg-black/40 p-3 text-white transition-colors hover:bg-black/60"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Image + caption */}
          <div
            className="max-h-[85vh] max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.src.replace(/\?w=\d+/, '')}
              alt={currentImage.label}
              className="max-h-[75vh] w-full object-contain"
            />
            <div className="px-4 py-3 text-center">
              <p id="lightbox-label" className="text-sm font-semibold text-stone-800">{currentImage.label}</p>
              <p className="text-xs text-stone-400">
                {lightboxIndex! + 1} / {lightboxImages.length}
              </p>
            </div>
          </div>

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-4 z-10 rounded-full bg-black/40 p-3 text-white transition-colors hover:bg-black/60"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
