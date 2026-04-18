import { useEffect, useRef, useState, useCallback } from 'react'
import { connectSocket, getSocket } from '@/api/socket'

export interface TestChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface StreamState {
  streamId: string
  text: string
}

export function useBotTestChat(botConfig: {
  botId: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  provider?: string | null
} | null) {
  const [messages, setMessages] = useState<TestChatMessage[]>([])
  const [streaming, setStreaming] = useState<StreamState | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const streamTextRef = useRef('')
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const processedStreamIds = useRef(new Set<string>())

  useEffect(() => {
    mountedRef.current = true
    const socket = connectSocket()

    const onConnect = () => {
      if (mountedRef.current) setConnected(true)
    }
    const onDisconnect = () => {
      if (mountedRef.current) setConnected(false)
    }
    const onConnectError = (err: Error) => {
      console.warn('[BotTestChat] socket connect error:', err.message)
    }

    const onStreamStart = (data: { streamId: string; botConfigId: string }) => {
      if (!mountedRef.current) return
      clearTimeout(waitingTimerRef.current)
      streamTextRef.current = ''
      setWaiting(false)
      setError(null)
      setStreaming({ streamId: data.streamId, text: '' })
    }

    const onStreamChunk = (data: { streamId: string; content: string }) => {
      if (!mountedRef.current) return
      streamTextRef.current += data.content
      setStreaming((prev) =>
        prev && prev.streamId === data.streamId
          ? { ...prev, text: streamTextRef.current }
          : prev,
      )
    }

    const onStreamEnd = (data: { streamId: string; fullText?: string; error?: string }) => {
      if (!mountedRef.current) return
      clearTimeout(waitingTimerRef.current)
      setWaiting(false)

      if (data.error) {
        setError(data.error)
        setStreaming(null)
        streamTextRef.current = ''
        return
      }

      const finalText = data.fullText || streamTextRef.current
      if (finalText && !processedStreamIds.current.has(data.streamId)) {
        processedStreamIds.current.add(data.streamId)
        setMessages((prev) => [
          ...prev,
          { id: data.streamId, role: 'assistant', content: finalText },
        ])
      }
      setStreaming(null)
      streamTextRef.current = ''
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('chat:stream-start', onStreamStart)
    socket.on('chat:stream-chunk', onStreamChunk)
    socket.on('chat:stream-end', onStreamEnd)

    if (socket.connected) setConnected(true)
    if (!socket.connected && socket.disconnected) socket.connect()

    return () => {
      mountedRef.current = false
      clearTimeout(waitingTimerRef.current)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('chat:stream-start', onStreamStart)
      socket.off('chat:stream-chunk', onStreamChunk)
      socket.off('chat:stream-end', onStreamEnd)
    }
  }, [])

  const sendMessage = useCallback(
    (text: string) => {
      if (!botConfig || !connected) return
      const socket = getSocket()
      if (!socket) return

      const userMsg: TestChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      }

      setError(null)
      setWaiting(true)

      // Timeout — if no stream-start within 30s, show error
      clearTimeout(waitingTimerRef.current)
      waitingTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setWaiting(false)
          setError('Бот не ответил — попробуйте снова')
        }
      }, 30000)

      setMessages((prev) => {
        const updated = [...prev, userMsg]
        socket.emit('bot:test-chat', {
          botId: botConfig.botId,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: botConfig.systemPrompt,
          model: botConfig.model,
          temperature: botConfig.temperature,
          maxTokens: botConfig.maxTokens,
          provider: botConfig.provider ?? undefined,
        })
        return updated
      })
    },
    [botConfig, connected],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setStreaming(null)
    setWaiting(false)
    setError(null)
    clearTimeout(waitingTimerRef.current)
    streamTextRef.current = ''
    processedStreamIds.current.clear()
  }, [])

  const isLoading = waiting || !!streaming

  return { messages, streaming, waiting, connected, error, isLoading, sendMessage, clearMessages }
}
