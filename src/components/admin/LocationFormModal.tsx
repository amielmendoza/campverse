import { useEffect, useState, type FormEvent } from 'react'
import type { Location, RateOption } from '../../lib/types'
import type { AmenityItem } from '../../lib/types'
import type { LocationFormData } from '../../hooks/useAdminLocations'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { generateSlug } from '../../lib/utils/slug'
import { normalizeAmenities, normalizeGallery } from '../../lib/utils/amenities'
import { inputClassName, labelClassName } from '../../lib/utils/styles'
import { useFocusTrap } from '../../lib/utils/useFocusTrap'
import { CloseIcon } from '../ui/CloseIcon'
import { PaymentQrUpload } from '../bookings/PaymentQrUpload'

interface ProfileOption {
  id: string
  username: string
  display_name: string | null
}

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LocationFormData) => Promise<void>
  initialData?: Location | null
}

export function LocationFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: LocationFormModalProps) {
  const isEditMode = !!initialData
  const trapRef = useFocusTrap(isOpen)
  const { isAdmin } = useAuth()

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
  const [rules, setRules] = useState('')
  const [ownerId, setOwnerId] = useState<string>('')
  const [rateOptions, setRateOptions] = useState<RateOption[]>([])
  const [paymentQrUrl, setPaymentQrUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([])

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
      setAmenities(normalizeAmenities(initialData.amenities))
      setGallery(normalizeGallery(initialData.gallery))
      setCapacity(initialData.capacity != null ? String(initialData.capacity) : '')
      setRules(initialData.rules ?? '')
      setOwnerId(initialData.owner_id ?? '')
      // Load rate_options, falling back to converting legacy price_per_night
      if (initialData.rate_options && Array.isArray(initialData.rate_options) && initialData.rate_options.length > 0) {
        setRateOptions(initialData.rate_options as unknown as RateOption[])
      } else if (initialData.price_per_night != null) {
        setRateOptions([{ label: 'Per Night', price: initialData.price_per_night, per: 'night' }])
      } else {
        setRateOptions([])
      }
      setPaymentQrUrl(initialData.payment_qr_url ?? '')
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
      setRules('')
      setOwnerId('')
      setRateOptions([])
      setPaymentQrUrl('')
      setIsActive(true)
    }

    setError(null)
    setSubmitting(false)

    // Fetch profiles for owner dropdown (admin only)
    if (isAdmin) {
      supabase
        .from('profiles')
        .select('id, username, display_name')
        .order('username')
        .then(({ data }) => {
          setProfileOptions(data ?? [])
        })
    }
  }, [isOpen, initialData, isAdmin])

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

  function addRateOption() {
    setRateOptions([...rateOptions, { label: '', price: 0, per: 'night' }])
  }

  function updateRateOption(index: number, field: keyof RateOption, value: string | number) {
    setRateOptions(rateOptions.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function removeRateOption(index: number) {
    setRateOptions(rateOptions.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (name.trim().length > 255) {
      setError('Name must be 255 characters or less.')
      return
    }
    if (description.trim().length > 5000) {
      setError('Description must be 5,000 characters or less.')
      return
    }
    if (rules.trim().length > 5000) {
      setError('Rules must be 5,000 characters or less.')
      return
    }
    if (region.trim().length > 255) {
      setError('Region must be 255 characters or less.')
      return
    }

    const validAmenities = amenities.filter((a) => a.name.trim())
    const validRateOptions = rateOptions.filter((r) => r.label.trim() && r.price > 0)

    // Validate rate options
    for (const opt of validRateOptions) {
      if (isNaN(opt.price) || opt.price <= 0) {
        setError(`Rate "${opt.label}" must have a positive price.`)
        return
      }
    }

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
      rules: rules.trim(),
      owner_id: ownerId || null,
      price_per_night: null,
      payment_qr_url: paymentQrUrl.trim() || null,
      rate_options: validRateOptions.length > 0 ? validRateOptions : null,
      is_active: isActive,
    }

    if (formData.latitude != null && isNaN(formData.latitude)) {
      setError('Latitude must be a valid number.')
      return
    }
    if (formData.latitude != null && (formData.latitude < -90 || formData.latitude > 90)) {
      setError('Latitude must be between -90 and 90.')
      return
    }
    if (formData.longitude != null && isNaN(formData.longitude)) {
      setError('Longitude must be a valid number.')
      return
    }
    if (formData.longitude != null && (formData.longitude < -180 || formData.longitude > 180)) {
      setError('Longitude must be between -180 and 180.')
      return
    }
    if (formData.capacity != null && isNaN(formData.capacity)) {
      setError('Capacity must be a valid number.')
      return
    }
    if (formData.capacity != null && formData.capacity < 0) {
      setError('Capacity cannot be negative.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-form-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 id="location-form-title" className="text-lg font-semibold text-stone-900">
            {isEditMode ? 'Edit Location' : 'Add Location'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
          >
            <CloseIcon />
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
                <label htmlFor="loc-name" className={labelClassName}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="loc-name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={submitting}
                  maxLength={255}
                  className={inputClassName}
                  placeholder="Pine Valley Camp"
                />
              </div>
              <div>
                <label htmlFor="loc-slug" className={labelClassName}>
                  Slug
                </label>
                <input
                  id="loc-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                  placeholder="pine-valley-camp"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="loc-desc" className={labelClassName}>
                Description
              </label>
              <textarea
                id="loc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={3}
                maxLength={5000}
                className={inputClassName + ' resize-y'}
                placeholder="A serene camping spot nestled among tall pines..."
              />
            </div>

            {/* Rules & Guidelines */}
            <div>
              <label htmlFor="loc-rules" className={labelClassName}>
                Rules & Guidelines
              </label>
              <textarea
                id="loc-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                disabled={submitting}
                rows={4}
                maxLength={5000}
                className={inputClassName + ' resize-y'}
                placeholder={"No open fires outside designated fire pits\nQuiet hours: 10 PM – 6 AM\nPack in, pack out — leave no trace"}
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="loc-img" className={labelClassName}>
                Image URL
              </label>
              <input
                id="loc-img"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={submitting}
                className={inputClassName}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Region */}
            <div>
              <label htmlFor="loc-region" className={labelClassName}>
                Region
              </label>
              <input
                id="loc-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={submitting}
                maxLength={255}
                className={inputClassName}
                placeholder="Tanay, Rizal"
              />
            </div>

            {/* Lat & Long */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-lat" className={labelClassName}>
                  Latitude
                </label>
                <input
                  id="loc-lat"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                  placeholder="14.5340"
                />
              </div>
              <div>
                <label htmlFor="loc-lng" className={labelClassName}>
                  Longitude
                </label>
                <input
                  id="loc-lng"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                  placeholder="121.4150"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClassName + ' mb-0'}>Amenities</label>
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
                            className={inputClassName}
                            placeholder="e.g. Fire Pits, Restrooms, Hiking Trails"
                          />
                          <input
                            type="text"
                            value={amenity.image_url}
                            onChange={(e) => updateAmenity(index, 'image_url', e.target.value)}
                            disabled={submitting}
                            className={inputClassName}
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
                          <CloseIcon className="h-4 w-4" />
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
                <label className={labelClassName + ' mb-0'}>Gallery Photos</label>
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
                        className={inputClassName + ' flex-1'}
                        placeholder="https://example.com/photo.jpg"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        disabled={submitting}
                        className="shrink-0 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        title="Remove photo"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Capacity & Active */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-cap" className={labelClassName}>
                  Capacity
                </label>
                <input
                  id="loc-cap"
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
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

            {/* Booking Setup */}
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-stone-800">Booking Setup</h3>
              <div className="space-y-4">
                {/* Rate Options */}
                <div>
                  <label className={labelClassName}>Rate Options</label>
                  <p className="mb-2 text-xs text-stone-400">
                    Define how campers pay — per tent, per person, per car, etc. Leave empty if not bookable.
                  </p>
                  <div className="space-y-2">
                    {rateOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateRateOption(i, 'label', e.target.value)}
                          disabled={submitting}
                          className={inputClassName}
                          placeholder="e.g. Tent Rental, Per Person"
                        />
                        <div className="relative shrink-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">PHP</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={opt.price || ''}
                            onChange={(e) => updateRateOption(i, 'price', parseFloat(e.target.value) || 0)}
                            disabled={submitting}
                            className={inputClassName + ' w-28 pl-10'}
                            placeholder="0"
                          />
                        </div>
                        <select
                          value={opt.per}
                          onChange={(e) => updateRateOption(i, 'per', e.target.value)}
                          disabled={submitting}
                          className={inputClassName + ' w-28 shrink-0'}
                        >
                          <option value="night">/ night</option>
                          <option value="stay">/ stay</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeRateOption(i)}
                          disabled={submitting}
                          className="shrink-0 text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addRateOption}
                    disabled={submitting}
                    className="mt-2 rounded-md border border-dashed border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
                  >
                    + Add Rate
                  </button>
                </div>

                {/* Payment QR */}
                <div>
                  <label className={labelClassName}>Payment QR Code</label>
                  <PaymentQrUpload
                    locationId={initialData?.id}
                    currentUrl={paymentQrUrl}
                    onChange={setPaymentQrUrl}
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-stone-400">Upload a GCash, PayMaya, or bank transfer QR code for camper payments.</p>
                </div>
              </div>
            </div>

            {/* Owner (admin only) */}
            {isAdmin && (
              <div>
                <label htmlFor="loc-owner" className={labelClassName}>
                  Owner
                </label>
                <select
                  id="loc-owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  disabled={submitting}
                  className={inputClassName}
                >
                  <option value="">No owner</option>
                  {profileOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name || p.username} (@{p.username})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
