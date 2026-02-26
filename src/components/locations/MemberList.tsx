import type { LocationMember } from '../../hooks/useLocationMembers'
import { Avatar } from '../ui/Avatar'

interface MemberListProps {
  members: LocationMember[]
}

export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Members</h2>
        <p className="text-sm text-stone-400">No members yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">
        Members ({members.length})
      </h2>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar
              name={member.profile.display_name ?? member.profile.username}
              imageUrl={member.profile.avatar_url}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-800">
                {member.profile.display_name ?? member.profile.username}
              </p>
              <p className="truncate text-xs text-stone-400">
                @{member.profile.username}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
