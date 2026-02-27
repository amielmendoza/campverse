import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLocationMembers } from '../hooks/useLocationMembers'
import type { LocationWithCount } from '../hooks/useLocations'
import { LocationDetail } from '../components/locations/LocationDetail'
import { MemberList } from '../components/locations/MemberList'
import { ChatRoom } from '../components/chat/ChatRoom'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function LocationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [location, setLocation] = useState<LocationWithCount | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function fetchLocation() {
      setPageLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('slug', slug!)
        .single()

      if (cancelled) return

      if (fetchError || !data) {
        setError('Location not found.')
        setPageLoading(false)
        return
      }

      const { count } = await supabase
        .from('location_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', data.id)

      if (cancelled) return

      setLocation({ ...data, memberCount: count ?? 0 })
      setPageLoading(false)
    }

    fetchLocation()

    return () => {
      cancelled = true
    }
  }, [slug])

  const { members, isMember, loading: membersLoading, join, leave } =
    useLocationMembers(location?.id)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleJoin = async () => {
    if (!location) return
    setActionLoading(true)
    setActionError(null)
    try {
      await join(location.id)
      setLocation((prev) =>
        prev ? { ...prev, memberCount: prev.memberCount + 1 } : prev,
      )
    } catch (err) {
      console.error('Failed to join:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to join location.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!location) return
    setActionLoading(true)
    setActionError(null)
    try {
      await leave(location.id)
      setLocation((prev) =>
        prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev,
      )
    } catch (err) {
      console.error('Failed to leave:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to leave location.')
    } finally {
      setActionLoading(false)
    }
  }

  if (pageLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (error || !location) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-lg text-stone-500">{error ?? 'Location not found.'}</p>
        <Link
          to="/locations"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Back to locations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/locations"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          &larr; All Locations
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <LocationDetail
        location={location}
        isMember={isMember}
        onJoin={handleJoin}
        onLeave={handleLeave}
        loading={actionLoading}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isMember ? (
            <div className="h-[500px]">
              <ChatRoom locationId={location.id} />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl bg-white shadow-sm">
              <div className="text-center">
                <p className="mb-2 text-stone-500">
                  Join this location to access the chat.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  Join Now
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          {membersLoading ? <LoadingSpinner /> : <MemberList members={members} />}
        </div>
      </div>
    </div>
  )
}
