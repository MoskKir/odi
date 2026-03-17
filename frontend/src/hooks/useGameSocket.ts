import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/store'
import { setMessages, addMessage, addCard, updateSession, updatePhase, setSocketJoined } from '@/store/appSlice'
import { connectSocket, disconnectSocket } from '@/api/socket'
import type { ChatMessage, BoardCard } from '@/types'

interface ServerChatMessage {
  id: string
  author: string
  role: string
  text: string
  isSystem: boolean
  createdAt: string
}

function toClientMessage(msg: ServerChatMessage): ChatMessage {
  return {
    id: msg.id,
    author: msg.author,
    role: msg.role as ChatMessage['role'],
    text: msg.text,
    timestamp: new Date(msg.createdAt).getTime(),
  }
}

async function loadHistory(sessionId: string): Promise<ChatMessage[]> {
  const token = localStorage.getItem('odi_token')
  const res = await fetch(`/api/games/${sessionId}/messages?limit=100&offset=0`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return []
  const data = await res.json()
  const items: ServerChatMessage[] = data.items ?? []
  // API returns DESC order, reverse to chronological
  return items.reverse().map(toClientMessage)
}

export function useGameSocket() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!sessionId) return

    dispatch(setSocketJoined(false))
    dispatch(setMessages([]))
    const socket = connectSocket()

    const joinSession = async () => {
      socket.emit('session:join', { sessionId })

      // Load chat history via REST
      const history = await loadHistory(sessionId)
      dispatch(setMessages(history))
    }

    socket.on('session:joined', () => {
      dispatch(setSocketJoined(true))
    })

    socket.on('connect', joinSession)

    if (socket.connected) {
      joinSession()
    }

    socket.on('chat:message', (data: { sessionId: string; message: ServerChatMessage }) => {
      dispatch(addMessage(toClientMessage(data.message)))
    })

    socket.on('session:update', (data: { teamOnline?: number; energy?: number }) => {
      dispatch(updateSession(data))
    })

    socket.on('phase:update', (data: { phase?: string; elapsed?: string }) => {
      dispatch(updatePhase(data))
    })

    socket.on('emotion:update', (_data: { userId: string; emotion: string }) => {
      // Emotion updates from other participants
    })

    socket.on('board:update', (data: BoardCard) => {
      dispatch(addCard(data))
    })

    return () => {
      socket.emit('session:leave', { sessionId })
      socket.off('connect', joinSession)
      socket.off('session:joined')
      socket.off('chat:message')
      socket.off('session:update')
      socket.off('phase:update')
      socket.off('emotion:update')
      socket.off('board:update')
      dispatch(setSocketJoined(false))
      disconnectSocket()
    }
  }, [sessionId, dispatch])

  return sessionId
}
