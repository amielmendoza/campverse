import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export function Navbar() {
  const { profile, isAdmin, ownedLocationIds, signOut } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const fetchPendingCount = useCallback(() => {
    supabase
      .from('location_change_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0))
  }, [])

  // Fetch pending approval count for admins + subscribe to changes
  useEffect(() => {
    if (!isAdmin) return

    fetchPendingCount()

    const channel = supabase
      .channel('navbar-pending-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'location_change_requests' },
        () => fetchPendingCount(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, fetchPendingCount])
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out failed:', err)
    }
    navigate('/login', { replace: true })
  }

  return (
    <nav className="border-b border-emerald-800 bg-emerald-700 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            to="/locations"
            className="text-xl font-bold tracking-tight text-white"
          >
            Campverse
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/locations"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-600 hover:text-white"
            >
              Locations
            </Link>
            {ownedLocationIds.length > 0 && !isAdmin && (
              <Link
                to="/my-locations"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-600 hover:text-white"
              >
                My Locations
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/locations"
                className="relative rounded-md bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 hover:text-amber-100"
              >
                Admin
                {pendingCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-emerald-100 sm:inline">
            {profile?.display_name ?? profile?.username}
          </span>
          <Link
            to="/profile"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="cursor-pointer rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-900 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}
