import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/ui/Avatar'

export function ProfilePage() {
  const { user, profile } = useAuth()

  if (!profile || !user) return null

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-stone-800">Your Profile</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            name={profile.display_name ?? profile.username}
            imageUrl={profile.avatar_url}
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold text-stone-800">
              {profile.display_name ?? profile.username}
            </h2>
            <p className="text-sm text-stone-400">@{profile.username}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-500">
              Email
            </label>
            <p className="mt-0.5 text-stone-800">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500">
              Username
            </label>
            <p className="mt-0.5 text-stone-800">@{profile.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500">
              Display Name
            </label>
            <p className="mt-0.5 text-stone-800">
              {profile.display_name ?? '(not set)'}
            </p>
          </div>
          {profile.bio && (
            <div>
              <label className="block text-sm font-medium text-stone-500">
                Bio
              </label>
              <p className="mt-0.5 text-stone-800">{profile.bio}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-500">
              Member Since
            </label>
            <p className="mt-0.5 text-stone-800">
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-stone-400">
          Profile editing will be available in a future update.
        </p>
      </div>
    </div>
  )
}
