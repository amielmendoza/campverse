import { useAuth } from '../../contexts/AuthContext'
import { useMessages } from '../../hooks/useMessages'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface ChatRoomProps {
  locationId: string
}

export function ChatRoom({ locationId }: ChatRoomProps) {
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useMessages(locationId)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="border-b border-stone-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-stone-800">Chat</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageList messages={messages} currentUserId={user.id} />
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  )
}
