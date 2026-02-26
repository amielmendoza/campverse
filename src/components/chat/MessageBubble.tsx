import type { MessageWithProfile } from '../../hooks/useMessages'
import { Avatar } from '../ui/Avatar'

interface MessageBubbleProps {
  message: MessageWithProfile
  isOwn: boolean
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const senderName =
    message.profile.display_name ?? message.profile.username ?? 'Unknown'

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={senderName} imageUrl={message.profile.avatar_url} size="sm" />
      <div className={`max-w-xs sm:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <p className="mb-0.5 text-xs font-medium text-stone-500">
            {senderName}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'rounded-br-md bg-emerald-600 text-white'
              : 'rounded-bl-md bg-stone-100 text-stone-800'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>
        <p
          className={`mt-0.5 text-xs text-stone-400 ${
            isOwn ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
