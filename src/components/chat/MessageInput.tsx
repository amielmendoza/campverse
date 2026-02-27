import { useState, type KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    setContent('')
    setError(null)

    try {
      await onSend(trimmed)
    } catch (err) {
      console.error('Failed to send message:', err)
      // Restore the text so the user can retry
      setContent(trimmed)
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-stone-200 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setError(null) }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          aria-label="Type a message"
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-800 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
