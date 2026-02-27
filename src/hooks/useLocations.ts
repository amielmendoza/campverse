import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Location } from '../lib/types'

export interface LocationWithCount extends Location {
  memberCount: number
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all active locations
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (locationError) throw locationError

      if (!locationData || locationData.length === 0) {
        setLocations([])
        setLoading(false)
        return
      }

      // Fetch member counts for each location
      const locationIds = locationData.map((l) => l.id)

      const { data: memberData, error: memberError } = await supabase
        .from('location_memberships')
        .select('location_id')
        .in('location_id', locationIds)

      if (memberError) throw memberError

      // Count members per location
      const countMap: Record<string, number> = {}
      for (const row of memberData ?? []) {
        countMap[row.location_id] = (countMap[row.location_id] ?? 0) + 1
      }

      const locationsWithCounts: LocationWithCount[] = locationData.map((loc) => ({
        ...loc,
        memberCount: countMap[loc.id] ?? 0,
      }))

      setLocations(locationsWithCounts)
    } catch (err: unknown) {
      console.error('Locations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  return { locations, loading, error, refetch: fetchLocations }
}
