import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/utils/slug'
import type { Location, AmenityItem } from '../lib/types'

export interface LocationFormData {
  name: string
  slug: string
  description: string
  image_url: string
  latitude: number | null
  longitude: number | null
  region: string
  amenities: AmenityItem[]
  gallery: string[]
  capacity: number | null
  is_active: boolean
}

export function useAdminLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setLocations(data ?? [])
    } catch (err: unknown) {
      console.error('Admin locations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const createLocation = useCallback(
    async (data: LocationFormData) => {
      const slug = data.slug || generateSlug(data.name)

      const { error: insertError } = await supabase.from('locations').insert({
        name: data.name,
        slug,
        description: data.description,
        image_url: data.image_url,
        latitude: data.latitude,
        longitude: data.longitude,
        region: data.region,
        amenities: data.amenities,
        gallery: data.gallery,
        capacity: data.capacity,
        is_active: data.is_active,
      })

      if (insertError) {
        console.error('Create location error:', insertError)
        throw new Error(insertError.message)
      }

      await fetchLocations()
    },
    [fetchLocations]
  )

  const updateLocation = useCallback(
    async (id: string, data: Partial<LocationFormData>) => {
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.image_url !== undefined) updateData.image_url = data.image_url
      if (data.latitude !== undefined) updateData.latitude = data.latitude
      if (data.longitude !== undefined) updateData.longitude = data.longitude
      if (data.region !== undefined) updateData.region = data.region
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.is_active !== undefined) updateData.is_active = data.is_active
      if (data.amenities !== undefined) {
        updateData.amenities = JSON.parse(JSON.stringify(data.amenities))
      }
      if (data.gallery !== undefined) {
        updateData.gallery = JSON.parse(JSON.stringify(data.gallery))
      }

      if (data.slug) {
        updateData.slug = data.slug
      } else if (data.name) {
        updateData.slug = generateSlug(data.name)
      }

      const { error: updateError } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Update location error:', updateError)
        throw new Error(updateError.message)
      }

      await fetchLocations()
    },
    [fetchLocations]
  )

  const deleteLocation = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Delete location error:', deleteError)
        throw new Error(deleteError.message)
      }

      await fetchLocations()
    },
    [fetchLocations]
  )

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch: fetchLocations,
  }
}
