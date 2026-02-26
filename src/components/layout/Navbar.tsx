import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function Navbar() {
  const { profile, isAdmin, signOut } = useAuth()
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
            {isAdmin && (
              <Link
                to="/admin/locations"
                className="rounded-md bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 hover:text-amber-100"
              >
                Admin
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
