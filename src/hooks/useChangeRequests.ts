import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ChangeRequestWithDetails {
  id: string
  location_id: string
  submitted_by: string
  changes: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  // Joined data
  location_name: string
  submitter_name: string
}

export function useChangeRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ChangeRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch pending requests with location and submitter info
      const { data, error: fetchError } = await supabase
        .from('location_change_requests')
        .select('*, locations:location_id(name), profiles:submitted_by(username, display_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const mapped: ChangeRequestWithDetails[] = (data ?? []).map((row) => {
        const loc = row.locations as unknown as { name: string } | null
        const prof = row.profiles as unknown as { username: string; display_name: string | null } | null
        return {
          id: row.id,
          location_id: row.location_id,
          submitted_by: row.submitted_by,
          changes: row.changes as Record<string, unknown>,
          status: row.status as 'pending' | 'approved' | 'rejected',
          admin_note: row.admin_note,
          reviewed_by: row.reviewed_by,
          created_at: row.created_at,
          reviewed_at: row.reviewed_at,
          location_name: loc?.name ?? 'Unknown',
          submitter_name: prof?.display_name ?? prof?.username ?? 'Unknown',
        }
      })

      setRequests(mapped)
    } catch (err: unknown) {
      console.error('Change requests fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch change requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const approveRequest = useCallback(
    async (requestId: string, editedChanges?: Record<string, unknown>) => {
      if (!user) return

      // Get the request details
      const request = requests.find((r) => r.id === requestId)
      if (!request) throw new Error('Request not found')

      // Apply the changes (use edited version if provided, otherwise original)
      // Security: only allow fields that were in the original request
      let changesToApply = editedChanges ?? request.changes
      if (editedChanges) {
        const allowedKeys = new Set(Object.keys(request.changes))
        const sanitized: Record<string, unknown> = {}
        for (const key of Object.keys(editedChanges)) {
          if (allowedKeys.has(key)) {
            sanitized[key] = editedChanges[key]
          }
        }
        changesToApply = sanitized
      }

      if (Object.keys(changesToApply).length === 0) {
        throw new Error('No valid changes to apply')
      }

      // Fetch current location to compute actual diffs for audit
      const { data: currentLocation } = await supabase
        .from('locations')
        .select('*')
        .eq('id', request.location_id)
        .single()

      // Filter to only fields that actually differ from current
      const actualChanges: Record<string, unknown> = {}
      const before: Record<string, unknown> = {}
      if (currentLocation) {
        for (const [key, val] of Object.entries(changesToApply)) {
          if (JSON.stringify((currentLocation as Record<string, unknown>)[key]) !== JSON.stringify(val)) {
            actualChanges[key] = val
            before[key] = (currentLocation as Record<string, unknown>)[key]
          }
        }
      }

      const finalChanges = Object.keys(actualChanges).length > 0 ? actualChanges : changesToApply

      const { error: updateError } = await supabase
        .from('locations')
        .update(finalChanges)
        .eq('id', request.location_id)

      if (updateError) {
        console.error('Apply changes error:', updateError)
        throw new Error(updateError.message)
      }

      // Mark request as approved
      const { error: statusError } = await supabase
        .from('location_change_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (statusError) {
        console.error('Update request status error:', statusError)
        throw new Error(statusError.message)
      }

      // Audit log — only log actual diffs
      await supabase.from('location_audit_log').insert({
        location_id: request.location_id,
        location_name: request.location_name,
        action: 'change_approved',
        actor_id: user.id,
        changes: { before, after: finalChanges },
        change_request_id: requestId,
      })

      await fetchRequests()
    },
    [user, requests, fetchRequests],
  )

  const rejectRequest = useCallback(
    async (requestId: string, note?: string) => {
      if (!user) return

      const request = requests.find((r) => r.id === requestId)

      const { error: statusError } = await supabase
        .from('location_change_requests')
        .update({
          status: 'rejected',
          admin_note: note || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (statusError) {
        console.error('Reject request error:', statusError)
        throw new Error(statusError.message)
      }

      // Audit log
      if (request) {
        await supabase.from('location_audit_log').insert({
          location_id: request.location_id,
          location_name: request.location_name,
          action: 'change_rejected',
          actor_id: user.id,
          changes: { proposed: request.changes, reason: note || null },
          change_request_id: requestId,
        })
      }

      await fetchRequests()
    },
    [user, requests, fetchRequests],
  )

  return {
    requests,
    loading,
    error,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  }
}
