import type { AmenityItem } from '../types'

/** Normalizes raw amenity data (string/object/mixed arrays) into AmenityItem[] */
export function normalizeAmenities(raw: unknown): AmenityItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((a: unknown) => {
    if (typeof a === 'string') return { name: a, image_url: '' }
    if (a && typeof a === 'object' && 'name' in a) {
      const obj = a as Record<string, unknown>
      return {
        name: typeof obj.name === 'string' ? obj.name : '',
        image_url: typeof obj.image_url === 'string' ? obj.image_url : '',
      }
    }
    return { name: '', image_url: '' }
  })
}

/** Normalizes raw gallery data into a string[] of valid URLs */
export function normalizeGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
}
