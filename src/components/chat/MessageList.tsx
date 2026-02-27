import { useEffect, useRef } from 'react'
import type { MessageWithProfile } from '../../hooks/useMessages'
import { MessageBubble } from './MessageBubble'
import { formatDate, getDateKey } from '../../lib/utils/dates'

interface MessageListProps {
  messages: MessageWithProfile[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-stone-400">
          No messages yet. Start the conversation!
        </p>
      </div>
    )
  }

  let lastDateKey = ''

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((message) => {
        const dateKey = getDateKey(message.created_at)
        const showDate = dateKey !== lastDateKey
        lastDateKey = dateKey

        return (
          <div key={message.id}>
            {showDate && (
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-stone-200" />
                <span className="text-xs font-medium text-stone-400">
                  {formatDate(message.created_at)}
                </span>
                <div className="flex-1 border-t border-stone-200" />
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.user_id === currentUserId}
            />
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
