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
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    // Only auto-scroll when new messages arrive (not on every refetch)
    if (messages.length === prevCountRef.current) return
    const isFirstLoad = prevCountRef.current === 0
    prevCountRef.current = messages.length

    const container = containerRef.current
    if (!container) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // Auto-scroll if: first load, or user was already near the bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (isFirstLoad || distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: isFirstLoad ? 'instant' : 'smooth' })
    }
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
    <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
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
