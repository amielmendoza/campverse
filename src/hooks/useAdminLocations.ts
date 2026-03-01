import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { generateSlug } from '../lib/utils/slug'
import type { Location, AmenityItem, RateOption } from '../lib/types'

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
  rules: string
  owner_id: string | null
  price_per_night: number | null
  payment_qr_url: string | null
  rate_options: RateOption[] | null
  is_active: boolean
}

export function useAdminLocations() {
  const { user } = useAuth()
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
      if (!user) return
      const slug = data.slug || generateSlug(data.name)

      const { data: created, error: insertError } = await supabase
        .from('locations')
        .insert({
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
          rules: data.rules || null,
          owner_id: data.owner_id || null,
          price_per_night: data.price_per_night,
          payment_qr_url: data.payment_qr_url || null,
          rate_options: data.rate_options as unknown as Record<string, unknown>[] | null,
          is_active: data.is_active,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Create location error:', insertError)
        throw new Error(insertError.message)
      }

      await supabase.from('location_audit_log').insert({
        location_id: created.id,
        location_name: data.name,
        action: 'created',
        actor_id: user.id,
        changes: { ...data, slug },
      })

      await fetchLocations()
    },
    [user, fetchLocations],
  )

  const updateLocation = useCallback(
    async (id: string, data: Partial<LocationFormData>) => {
      if (!user) return

      // Get current state for audit before/after
      const current = locations.find((l) => l.id === id)

      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.image_url !== undefined) updateData.image_url = data.image_url
      if (data.latitude !== undefined) updateData.latitude = data.latitude
      if (data.longitude !== undefined) updateData.longitude = data.longitude
      if (data.region !== undefined) updateData.region = data.region
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.rules !== undefined) updateData.rules = data.rules || null
      if (data.owner_id !== undefined) updateData.owner_id = data.owner_id || null
      if (data.price_per_night !== undefined) updateData.price_per_night = data.price_per_night
      if (data.payment_qr_url !== undefined) updateData.payment_qr_url = data.payment_qr_url || null
      if (data.rate_options !== undefined) updateData.rate_options = data.rate_options as unknown as Record<string, unknown>[] | null
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

      // Build before/after for changed fields
      const before: Record<string, unknown> = {}
      const after: Record<string, unknown> = {}
      for (const key of Object.keys(updateData)) {
        if (current && JSON.stringify((current as Record<string, unknown>)[key]) !== JSON.stringify(updateData[key])) {
          before[key] = (current as Record<string, unknown>)[key]
          after[key] = updateData[key]
        }
      }

      await supabase.from('location_audit_log').insert({
        location_id: id,
        location_name: current?.name ?? data.name ?? 'Unknown',
        action: 'updated',
        actor_id: user.id,
        changes: { before, after },
      })

      await fetchLocations()
    },
    [user, locations, fetchLocations],
  )

  const deleteLocation = useCallback(
    async (id: string) => {
      if (!user) return

      const current = locations.find((l) => l.id === id)

      // Insert audit entry before delete (location_id will be SET NULL on cascade)
      await supabase.from('location_audit_log').insert({
        location_id: id,
        location_name: current?.name ?? 'Unknown',
        action: 'deleted',
        actor_id: user.id,
      })

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
    [user, locations, fetchLocations],
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
