import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Location } from '../lib/types'
import type { LocationFormData } from './useAdminLocations'
import { generateSlug } from '../lib/utils/slug'

export interface ChangeRequest {
  id: string
  location_id: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

export function useOwnerLocations() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [pendingRequests, setPendingRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    if (!user) {
      setLocations([])
      setPendingRequests([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [locResult, reqResult] = await Promise.all([
        supabase
          .from('locations')
          .select('*')
          .eq('owner_id', user.id)
          .order('name'),
        supabase
          .from('location_change_requests')
          .select('id, location_id, status, admin_note, created_at, reviewed_at')
          .eq('submitted_by', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (locResult.error) throw locResult.error
      setLocations(locResult.data ?? [])
      setPendingRequests((reqResult.data as ChangeRequest[]) ?? [])
    } catch (err: unknown) {
      console.error('Owner locations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const submitChangeRequest = useCallback(
    async (locationId: string, data: Partial<LocationFormData>) => {
      if (!user) throw new Error('Not authenticated')

      // Find the current location to compare against
      const currentLocation = locations.find((l) => l.id === locationId)
      if (!currentLocation) throw new Error('Location not found')

      // Build changes object with only fields that actually differ
      const changes: Record<string, unknown> = {}

      function changed(newVal: unknown, currentVal: unknown) {
        return JSON.stringify(newVal) !== JSON.stringify(currentVal)
      }

      if (data.name !== undefined && changed(data.name, currentLocation.name)) {
        changes.name = data.name
        changes.slug = data.slug || generateSlug(data.name)
      }
      if (data.description !== undefined && changed(data.description, currentLocation.description ?? ''))
        changes.description = data.description
      if (data.image_url !== undefined && changed(data.image_url, currentLocation.image_url ?? ''))
        changes.image_url = data.image_url
      if (data.latitude !== undefined && changed(data.latitude, currentLocation.latitude))
        changes.latitude = data.latitude
      if (data.longitude !== undefined && changed(data.longitude, currentLocation.longitude))
        changes.longitude = data.longitude
      if (data.region !== undefined && changed(data.region, currentLocation.region ?? ''))
        changes.region = data.region
      if (data.capacity !== undefined && changed(data.capacity, currentLocation.capacity))
        changes.capacity = data.capacity
      if (data.rules !== undefined && changed(data.rules || null, currentLocation.rules))
        changes.rules = data.rules || null
      if (data.is_active !== undefined && changed(data.is_active, currentLocation.is_active))
        changes.is_active = data.is_active
      if (data.amenities !== undefined && changed(data.amenities, currentLocation.amenities))
        changes.amenities = data.amenities
      if (data.gallery !== undefined && changed(data.gallery, currentLocation.gallery))
        changes.gallery = data.gallery
      if (data.price_per_night !== undefined && changed(data.price_per_night, currentLocation.price_per_night))
        changes.price_per_night = data.price_per_night
      if (data.payment_qr_url !== undefined && changed(data.payment_qr_url, currentLocation.payment_qr_url))
        changes.payment_qr_url = data.payment_qr_url
      if (data.rate_options !== undefined && changed(data.rate_options, currentLocation.rate_options))
        changes.rate_options = data.rate_options

      if (Object.keys(changes).length === 0) {
        throw new Error('No changes detected.')
      }

      const { error: insertError } = await supabase
        .from('location_change_requests')
        .insert({
          location_id: locationId,
          submitted_by: user.id,
          changes,
        })

      if (insertError) {
        console.error('Submit change request error:', insertError)
        throw new Error(insertError.message)
      }

      await fetchLocations()
    },
    [user, locations, fetchLocations],
  )

  return {
    locations,
    pendingRequests,
    loading,
    error,
    submitChangeRequest,
    refetch: fetchLocations,
  }
}
