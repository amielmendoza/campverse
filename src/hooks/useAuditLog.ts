import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AuditLogEntry {
  id: string
  location_id: string | null
  location_name: string
  action: 'created' | 'updated' | 'deleted' | 'change_approved' | 'change_rejected'
  actor_id: string
  actor_name: string
  changes: Record<string, unknown> | null
  change_request_id: string | null
  created_at: string
}

const PAGE_SIZE = 25

export function useAuditLog(locationId?: string) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const fetchEntries = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('location_audit_log')
          .select('*, profiles:actor_id(username, display_name)')
          .order('created_at', { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

        if (locationId) {
          query = query.eq('location_id', locationId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        const mapped: AuditLogEntry[] = (data ?? []).map((row) => {
          const prof = row.profiles as unknown as { username: string; display_name: string | null } | null
          return {
            id: row.id,
            location_id: row.location_id,
            location_name: row.location_name,
            action: row.action as AuditLogEntry['action'],
            actor_id: row.actor_id,
            actor_name: prof?.display_name ?? prof?.username ?? 'Unknown',
            changes: row.changes as Record<string, unknown> | null,
            change_request_id: row.change_request_id,
            created_at: row.created_at,
          }
        })

        if (pageNum === 0) {
          setEntries(mapped)
        } else {
          setEntries((prev) => [...prev, ...mapped])
        }
        setHasMore(mapped.length === PAGE_SIZE)
      } catch (err: unknown) {
        console.error('Audit log fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch audit log')
      } finally {
        setLoading(false)
      }
    },
    [locationId],
  )

  useEffect(() => {
    setPage(0)
    fetchEntries(0)
  }, [fetchEntries])

  const loadMore = useCallback(() => {
    const next = page + 1
    setPage(next)
    fetchEntries(next)
  }, [page, fetchEntries])

  return {
    entries,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => { setPage(0); fetchEntries(0) },
  }
}
