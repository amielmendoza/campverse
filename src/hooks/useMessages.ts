import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MESSAGES_PER_PAGE } from '../lib/constants'
import type { Message } from '../lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface MessageWithProfile extends Message {
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function useMessages(locationId: string | undefined) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial messages
  useEffect(() => {
    if (!locationId) {
      setMessages([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadMessages() {
      setLoading(true)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('location_id', locationId!)
        .order('created_at', { ascending: true })
        .limit(MESSAGES_PER_PAGE)

      if (cancelled) return

      if (error) {
        console.error('Error fetching messages:', error.message)
        setLoading(false)
        return
      }

      const mapped: MessageWithProfile[] = (data ?? []).map((row: any) => ({
        id: row.id,
        location_id: row.location_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        profile: {
          username: row.profiles?.username ?? '',
          display_name: row.profiles?.display_name ?? null,
          avatar_url: row.profiles?.avatar_url ?? null,
        },
      }))

      setMessages(mapped)
      setLoading(false)
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [locationId])

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!locationId) return

    const channel = supabase
      .channel(`messages:location_id=eq.${locationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `location_id=eq.${locationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message

          // Fetch the sender profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', newMsg.user_id)
            .single()

          const messageWithProfile: MessageWithProfile = {
            ...newMsg,
            profile: {
              username: profileData?.username ?? '',
              display_name: profileData?.display_name ?? null,
              avatar_url: profileData?.avatar_url ?? null,
            },
          }

          setMessages((prev) => {
            // Avoid duplicates (in case the sender already added it optimistically)
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, messageWithProfile]
          })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [locationId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) throw new Error('Must be signed in to send a message')
      if (!locationId) throw new Error('No location specified')

      const { error } = await supabase.from('messages').insert({
        location_id: locationId,
        user_id: user.id,
        content,
      })

      if (error) throw error
    },
    [user, locationId],
  )

  return { messages, loading, sendMessage }
}
