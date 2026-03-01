import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MESSAGES_PER_PAGE } from '../lib/constants'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface MessageWithProfile {
  id: string
  location_id: string
  user_id: string
  content: string
  created_at: string
  profile: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageRow {
  id: string
  location_id: string
  user_id: string
  content: string
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

function mapRows(data: MessageRow[]): MessageWithProfile[] {
  return data.map((row) => ({
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
}

export function useMessages(locationId: string | undefined) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch all messages with profiles in a single query
  const fetchMessages = useCallback(async (): Promise<MessageWithProfile[] | null> => {
    if (!locationId) return null

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
      .eq('location_id', locationId)
      .order('created_at', { ascending: true })
      .limit(MESSAGES_PER_PAGE)

    if (error || !data) return null
    return mapRows(data as MessageRow[])
  }, [locationId])

  // Mark chat as read — fire-and-forget with proper error handling
  const markAsRead = useCallback(() => {
    if (!user || !locationId) return
    supabase
      .from('location_memberships')
      .update({ last_read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('location_id', locationId)
      .then(({ error }) => {
        if (error) console.warn('Failed to mark as read:', error.message)
      })
  }, [user, locationId])

  // Initial load
  useEffect(() => {
    if (!locationId) {
      setMessages([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await fetchMessages()
      if (cancelled) return
      if (result) setMessages(result)
      setLoading(false)
      markAsRead()
    }

    load()
    return () => { cancelled = true }
  }, [locationId, fetchMessages, markAsRead])

  // Realtime subscription + polling fallback
  useEffect(() => {
    if (!locationId) return

    const refetch = () => {
      fetchMessages().then((result) => {
        if (result) setMessages(result)
      })
    }

    const channel = supabase
      .channel(`messages:${locationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `location_id=eq.${locationId}`,
        },
        () => {
          refetch()
          markAsRead()
        },
      )
      .subscribe()

    channelRef.current = channel

    // Polling fallback — always active as a safety net
    const poll = setInterval(() => {
      refetch()
    }, 5000)

    return () => {
      clearInterval(poll)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [locationId, fetchMessages, markAsRead])

  // Send: optimistic update + refetch for confirmation
  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) throw new Error('Must be signed in to send a message')
      if (!locationId) throw new Error('No location specified')

      // Optimistic: add message to the list immediately
      const optimisticMsg: MessageWithProfile = {
        id: `optimistic-${Date.now()}`,
        location_id: locationId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        profile: {
          username: profile?.username ?? '',
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
      }
      setMessages((prev) => [...prev, optimisticMsg])

      const { error } = await supabase
        .from('messages')
        .insert({
          location_id: locationId,
          user_id: user.id,
          content,
        })

      if (error) {
        // Rollback optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
        throw error
      }

      // Refetch to replace optimistic message with real data
      const result = await fetchMessages()
      if (result) setMessages(result)

      markAsRead()
    },
    [user, locationId, fetchMessages, profile, markAsRead],
  )

  return { messages, loading, sendMessage }
}
