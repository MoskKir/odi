import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/store'
import { setMessages, addMessage, addCard, updateSession, updatePhase, setSocketJoined, setSessionTitle, setScenarioInfo, setSessionBots, setSessionParticipants, setInviteCode, startStream, appendStreamChunk, endStream } from '@/store/appSlice'
import { connectSocket, disconnectSocket } from '@/api/socket'
import { fetchGame } from '@/api/games'
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
    let mounted = true

    const joinSession = async () => {
      socket.emit('session:join', { sessionId })
      const [history, game] = await Promise.all([
        loadHistory(sessionId),
        fetchGame(sessionId).catch(() => null),
      ])
      if (mounted) {
        dispatch(setMessages(history))
        if (game?.title) {
          dispatch(setSessionTitle(game.title))
          document.title = game.title
        }
        if (game?.inviteCode) {
          dispatch(setInviteCode(game.inviteCode))
        }
        if (game?.scenario) {
          dispatch(setScenarioInfo(game.scenario))
        }
        if (game?.participants) {
          const bots = game.participants
            .filter((p) => p.botConfig)
            .map((p) => p.botConfig!)
          dispatch(setSessionBots(bots))

          const participants = game.participants.map((p) => ({
            id: p.id,
            role: p.role,
            isOnline: p.isOnline ?? false,
            contributionsCount: p.contributionsCount ?? 0,
            currentEmotion: p.currentEmotion,
            userName: p.user?.name,
            botConfigId: p.botConfig?.id,
            botName: p.botConfig?.name,
            botSpecialistId: p.botConfig?.specialistId,
          }))
          dispatch(setSessionParticipants(participants))
        }
      }
    }

    socket.on('session:joined', () => {
      if (mounted) dispatch(setSocketJoined(true))
    })

    socket.on('chat:message', (data: { sessionId: string; message: ServerChatMessage }) => {
      if (mounted && data.message) dispatch(addMessage(toClientMessage(data.message)))
    })

    socket.on('session:update', (data: { teamOnline?: number; energy?: number }) => {
      if (mounted) dispatch(updateSession(data))
    })

    socket.on('phase:update', (data: { phase?: string; elapsed?: string }) => {
      if (mounted) dispatch(updatePhase(data))
    })

    socket.on('chat:stream-start', (data: { streamId: string; botConfigId: string }) => {
      if (mounted) dispatch(startStream({ streamId: data.streamId, botConfigId: data.botConfigId }))
    })

    socket.on('chat:stream-chunk', (data: { streamId: string; content: string }) => {
      if (mounted) dispatch(appendStreamChunk({ streamId: data.streamId, content: data.content }))
    })

    socket.on('chat:stream-end', (data: { streamId: string; stopped?: boolean }) => {
      if (mounted) dispatch(endStream({ streamId: data.streamId, stopped: data.stopped }))
    })

    socket.on('emotion:update', () => {})

    socket.on('board:update', (data: BoardCard) => {
      if (mounted) dispatch(addCard(data))
    })

    socket.on('connect', joinSession)

    // Socket may already be connected (e.g. reconnect)
    if (socket.connected) {
      joinSession()
    }

    return () => {
      mounted = false
      socket.emit('session:leave', { sessionId })
      dispatch(setSocketJoined(false))
      disconnectSocket()
    }
  }, [sessionId, dispatch])

  return sessionId
}
