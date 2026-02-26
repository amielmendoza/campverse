import { useEffect, useState, type FormEvent } from 'react'
import type { Location } from '../../lib/types'
import type { AmenityItem } from '../../lib/types'
import type { LocationFormData } from '../../hooks/useAdminLocations'

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LocationFormData) => Promise<void>
  initialData?: Location | null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function LocationFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: LocationFormModalProps) {
  const isEditMode = !!initialData

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [region, setRegion] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [amenities, setAmenities] = useState<AmenityItem[]>([])
  const [gallery, setGallery] = useState<string[]>([])
  const [capacity, setCapacity] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    if (initialData) {
      setName(initialData.name ?? '')
      setSlug(initialData.slug ?? '')
      setDescription(initialData.description ?? '')
      setImageUrl(initialData.image_url ?? '')
      setRegion(initialData.region ?? '')
      setLatitude(initialData.latitude != null ? String(initialData.latitude) : '')
      setLongitude(initialData.longitude != null ? String(initialData.longitude) : '')
      setAmenities(
        Array.isArray(initialData.amenities)
          ? initialData.amenities.map((a: any) =>
              typeof a === 'string'
                ? { name: a, image_url: '' }
                : { name: a.name ?? '', image_url: a.image_url ?? '' }
            )
          : [],
      )
      setGallery(
        Array.isArray(initialData.gallery)
          ? initialData.gallery.filter((url: any) => typeof url === 'string')
          : [],
      )
      setCapacity(initialData.capacity != null ? String(initialData.capacity) : '')
      setIsActive(initialData.is_active ?? true)
    } else {
      setName('')
      setSlug('')
      setDescription('')
      setImageUrl('')
      setRegion('')
      setLatitude('')
      setLongitude('')
      setAmenities([])
      setGallery([])
      setCapacity('')
      setIsActive(true)
    }

    setError(null)
    setSubmitting(false)
  }, [isOpen, initialData])

  function handleNameChange(value: string) {
    setName(value)
    if (!isEditMode) {
      setSlug(generateSlug(value))
    }
  }

  function addAmenity() {
    setAmenities([...amenities, { name: '', image_url: '' }])
  }

  function updateAmenity(index: number, field: keyof AmenityItem, value: string) {
    setAmenities(amenities.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  function removeAmenity(index: number) {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  function addGalleryImage() {
    setGallery([...gallery, ''])
  }

  function updateGalleryImage(index: number, value: string) {
    setGallery(gallery.map((url, i) => (i === index ? value : url)))
  }

  function removeGalleryImage(index: number) {
    setGallery(gallery.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    const validAmenities = amenities.filter((a) => a.name.trim())

    const formData: LocationFormData = {
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      description: description.trim(),
      image_url: imageUrl.trim(),
      latitude: latitude.trim() ? parseFloat(latitude) : null,
      longitude: longitude.trim() ? parseFloat(longitude) : null,
      region: region.trim(),
      amenities: validAmenities.map((a) => ({ name: a.name.trim(), image_url: a.image_url.trim() })),
      gallery: gallery.map((url) => url.trim()).filter(Boolean),
      capacity: capacity.trim() ? parseInt(capacity, 10) : null,
      is_active: isActive,
    }

    if (formData.latitude != null && isNaN(formData.latitude)) {
      setError('Latitude must be a valid number.')
      return
    }
    if (formData.longitude != null && isNaN(formData.longitude)) {
      setError('Longitude must be a valid number.')
      return
    }
    if (formData.capacity != null && isNaN(formData.capacity)) {
      setError('Capacity must be a valid number.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputClass =
    'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-stone-100 disabled:opacity-60'

  const labelClass = 'mb-1 block text-sm font-medium text-stone-700'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEditMode ? 'Edit Location' : 'Add Location'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Name & Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-name" className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="loc-name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="Pine Valley Camp"
                />
              </div>
              <div>
                <label htmlFor="loc-slug" className={labelClass}>
                  Slug
                </label>
                <input
                  id="loc-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="pine-valley-camp"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="loc-desc" className={labelClass}>
                Description
              </label>
              <textarea
                id="loc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={3}
                className={inputClass + ' resize-y'}
                placeholder="A serene camping spot nestled among tall pines..."
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="loc-img" className={labelClass}>
                Image URL
              </label>
              <input
                id="loc-img"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={submitting}
                className={inputClass}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Region */}
            <div>
              <label htmlFor="loc-region" className={labelClass}>
                Region
              </label>
              <input
                id="loc-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={submitting}
                className={inputClass}
                placeholder="Tanay, Rizal"
              />
            </div>

            {/* Lat & Long */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-lat" className={labelClass}>
                  Latitude
                </label>
                <input
                  id="loc-lat"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="14.5340"
                />
              </div>
              <div>
                <label htmlFor="loc-lng" className={labelClass}>
                  Longitude
                </label>
                <input
                  id="loc-lng"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="121.4150"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass + ' mb-0'}>Amenities</label>
                <button
                  type="button"
                  onClick={addAmenity}
                  disabled={submitting}
                  className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                >
                  + Add Amenity
                </button>
              </div>

              {amenities.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-300 py-4 text-center text-sm text-stone-400">
                  No amenities added. Click "Add Amenity" to start.
                </p>
              ) : (
                <div className="space-y-3">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                    >
                      <div className="mb-2 flex items-start gap-3">
                        {/* Image preview */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
                          {amenity.image_url ? (
                            <img
                              src={amenity.image_url}
                              alt={amenity.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={amenity.name}
                            onChange={(e) => updateAmenity(index, 'name', e.target.value)}
                            disabled={submitting}
                            className={inputClass}
                            placeholder="e.g. Fire Pits, Restrooms, Hiking Trails"
                          />
                          <input
                            type="text"
                            value={amenity.image_url}
                            onChange={(e) => updateAmenity(index, 'image_url', e.target.value)}
                            disabled={submitting}
                            className={inputClass}
                            placeholder="Image URL (optional)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          disabled={submitting}
                          className="shrink-0 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          title="Remove amenity"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gallery */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass + ' mb-0'}>Gallery Photos</label>
                <button
                  type="button"
                  onClick={addGalleryImage}
                  disabled={submitting}
                  className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                >
                  + Add Photo
                </button>
              </div>

              {gallery.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stone-300 py-4 text-center text-sm text-stone-400">
                  No gallery photos added. Click "Add Photo" to start.
                </p>
              ) : (
                <div className="space-y-3">
                  {gallery.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200">
                        {url ? (
                          <img
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                            No img
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => updateGalleryImage(index, e.target.value)}
                        disabled={submitting}
                        className={inputClass + ' flex-1'}
                        placeholder="https://example.com/photo.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        disabled={submitting}
                        className="shrink-0 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        title="Remove photo"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Capacity & Active */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-cap" className={labelClass}>
                  Capacity
                </label>
                <input
                  id="loc-cap"
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="50"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={submitting}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-stone-300 transition-colors peer-checked:bg-emerald-500 peer-disabled:opacity-60" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-stone-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </span>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Location'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
