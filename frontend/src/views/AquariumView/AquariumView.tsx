import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, Tag, Icon, NonIdealState, Button, Tabs, Tab, TextArea } from '@blueprintjs/core'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'
import { ChatAvatar } from '@/components/ChatAvatar'
import { getSocket } from '@/api/socket'
import type { SessionBot } from '@/store/appSlice'

const DEFAULT_REFLECTION_PROMPT =
  'Проанализируй ход дискуссии. Какие ключевые идеи были высказаны? Что упущено? Какие противоречия ты видишь? Предложи свою рефлексию.'

interface Reflection {
  id: string
  sessionId: string
  botConfigId: string
  botName: string
  prompt: string
  text: string
  createdAt: string
}

interface ReflectionStream {
  streamId: string
  botConfigId: string
  text: string
  done?: boolean
}

function formatTime(ts: number | string) {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** Load saved reflections from the API */
async function loadReflections(sessionId: string): Promise<Reflection[]> {
  const token = localStorage.getItem('odi_token')
  const res = await fetch(`/api/games/${sessionId}/messages/reflections`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return []
  return res.json()
}

/** Hook: manages reflection-specific socket events & state, scoped to AquariumView */
function useReflections(sessionId: string) {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [streams, setStreams] = useState<Record<string, ReflectionStream>>({})
  // Keep finished streams visible until reflection:created arrives
  const [pendingStreams, setPendingStreams] = useState<Record<string, ReflectionStream>>({})

  // Load history on mount
  useEffect(() => {
    if (!sessionId) return
    loadReflections(sessionId).then((data) => setReflections(data.reverse()))
  }, [sessionId])

  // Socket listeners
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onStart = (data: { streamId: string; botConfigId: string }) => {
      setStreams((prev) => ({
        ...prev,
        [data.streamId]: { streamId: data.streamId, botConfigId: data.botConfigId, text: '' },
      }))
    }

    const onChunk = (data: { streamId: string; content: string }) => {
      setStreams((prev) => {
        const s = prev[data.streamId]
        if (!s) return prev
        return { ...prev, [data.streamId]: { ...s, text: s.text + data.content } }
      })
    }

    const onEnd = (data: { streamId: string }) => {
      setStreams((prev) => {
        const stream = prev[data.streamId]
        if (stream) {
          // Move to pending so text stays visible
          setPendingStreams((p) => ({ ...p, [stream.botConfigId]: { ...stream, done: true } }))
        }
        const next = { ...prev }
        delete next[data.streamId]
        return next
      })
    }

    const onCreated = (data: { reflection: Reflection }) => {
      if (data.reflection) {
        setReflections((prev) => [...prev, data.reflection])
        // Clear pending stream for this bot
        setPendingStreams((prev) => {
          const next = { ...prev }
          delete next[data.reflection.botConfigId]
          return next
        })
      }
    }

    socket.on('reflection:stream-start', onStart)
    socket.on('reflection:stream-chunk', onChunk)
    socket.on('reflection:stream-end', onEnd)
    socket.on('reflection:created', onCreated)

    return () => {
      socket.off('reflection:stream-start', onStart)
      socket.off('reflection:stream-chunk', onChunk)
      socket.off('reflection:stream-end', onEnd)
      socket.off('reflection:created', onCreated)
    }
  }, [])

  // Merge active streams and pending (finished but not yet saved) streams
  const allStreams = [...Object.values(streams), ...Object.values(pendingStreams)]

  return { reflections, streams: allStreams }
}

interface BotCardProps {
  bot: SessionBot
  isOnline: boolean
  totalMessages: number
  lastMessages: { id: string; text: string; timestamp: number; isEdited?: boolean }[]
  activeStream: { streamId: string; botConfigId: string; text: string } | undefined
  botReflections: Reflection[]
  activeReflectionStream: ReflectionStream | undefined
  sessionId: string
  isAdmin: boolean
}

function BotCard({
  bot, isOnline, totalMessages, lastMessages, activeStream,
  botReflections, activeReflectionStream, sessionId, isAdmin,
}: BotCardProps) {
  const [tab, setTab] = useState<string>('messages')
  const [reflectionPrompt, setReflectionPrompt] = useState(DEFAULT_REFLECTION_PROMPT)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const socketJoined = useAppSelector((s) => s.app.socketJoined)

  const handleReflect = useCallback(() => {
    if (!socketJoined || !sessionId) return
    const socket = getSocket()
    socket?.emit('reflection:request', {
      sessionId,
      botConfigId: bot.id,
      prompt: reflectionPrompt,
    })
  }, [socketJoined, sessionId, bot.id, reflectionPrompt])

  const isGenerating = !!activeReflectionStream

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none flex flex-col">
      {/* Bot header */}
      <div className="flex items-center gap-3 mb-2">
        <ChatAvatar name={bot.name} role={bot.specialistId} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-odi-text truncate">{bot.name}</span>
            <Tag minimal intent={isOnline ? 'success' : 'none'} className="!text-[10px]">
              {isOnline ? 'online' : 'offline'}
            </Tag>
          </div>
          <div className="text-xs text-odi-text-muted truncate">{bot.description}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-odi-text-muted">
            <Icon icon="chat" size={10} className="mr-1" />
            {totalMessages}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        id={`bot-tabs-${bot.id}`}
        selectedTabId={tab}
        onChange={(id) => setTab(id as string)}
        className="mb-3 [&_.bp5-tab-list]:!bg-transparent [&_.bp5-tab-list]:!border-b [&_.bp5-tab-list]:!border-odi-border/50 [&_.bp5-tab]:!text-xs [&_.bp5-tab]:!text-odi-text-muted [&_.bp5-tab]:!py-1.5 [&_.bp5-tab]:!px-3 [&_.bp5-tab[aria-selected=true]]:!text-odi-accent [&_.bp5-tab-indicator-wrapper]:!hidden"
      >
        <Tab id="messages" title="Сообщения" icon="chat" />
        <Tab id="reflection" title="Рефлексия" icon="lightbulb" />
      </Tabs>

      {tab === 'messages' && (
        <>
          {/* Active chat stream */}
          {activeStream && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-odi-accent/10 border border-odi-accent/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-odi-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-odi-accent" />
                </span>
                <span className="text-[10px] font-medium text-odi-accent uppercase tracking-wider">
                  Генерирует ответ
                </span>
              </div>
              <div className="text-sm text-odi-text break-words leading-relaxed">
                <Markdown>{activeStream.text}</Markdown>
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
            {lastMessages.length === 0 && !activeStream && (
              <div className="text-xs text-odi-text-muted italic text-center py-4">
                Бот ещё не высказывался
              </div>
            )}
            {lastMessages.map((msg) => (
              <div key={msg.id} className="px-3 py-2 rounded-lg bg-odi-bg/50 border border-odi-border/50">
                <div className="text-sm text-odi-text break-words leading-relaxed">
                  <Markdown>{msg.text}</Markdown>
                </div>
                <div className="text-[10px] text-odi-text-muted mt-1">
                  {formatTime(msg.timestamp)}
                  {msg.isEdited && <span className="ml-1 italic">(ред.)</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'reflection' && (
        <div className="flex flex-col gap-3">
          {/* Prompt display / edit */}
          {isAdmin ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-odi-text-muted uppercase tracking-wider">Промпт рефлексии</span>
                <Button
                  icon={isEditingPrompt ? 'tick' : 'edit'}
                  minimal
                  small
                  onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                />
              </div>
              {isEditingPrompt ? (
                <TextArea
                  value={reflectionPrompt}
                  onChange={(e) => setReflectionPrompt(e.target.value)}
                  className="!bg-odi-bg !text-odi-text !border-odi-border !text-xs w-full"
                  rows={4}
                  autoFocus
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-odi-bg/50 border border-odi-border/50 text-xs text-odi-text-muted italic">
                  {reflectionPrompt}
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-odi-bg/50 border border-odi-border/50 text-xs text-odi-text-muted italic">
              {reflectionPrompt}
            </div>
          )}

          <Button
            icon="refresh"
            intent="primary"
            text="Запросить рефлексию"
            onClick={handleReflect}
            disabled={!socketJoined || isGenerating}
            loading={isGenerating}
          />

          {/* Active reflection stream */}
          {activeReflectionStream && (
            <div className="px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-2 w-2">
                  {!activeReflectionStream.done && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">
                  {activeReflectionStream.done ? 'Сохранение...' : 'Рефлексия...'}
                </span>
              </div>
              <div className="text-sm text-odi-text break-words leading-relaxed">
                <Markdown>{activeReflectionStream.text}</Markdown>
                {!activeReflectionStream.done && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-500 animate-pulse rounded-sm align-text-bottom" />
                )}
              </div>
            </div>
          )}

          {/* Saved reflections */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
            {botReflections.length === 0 && !activeReflectionStream && (
              <div className="text-xs text-odi-text-muted italic text-center py-4">
                Рефлексий пока нет
              </div>
            )}
            {botReflections.map((r) => (
              <div key={r.id} className="px-3 py-2 rounded-lg bg-odi-bg/50 border border-violet-500/20">
                <div className="text-sm text-odi-text break-words leading-relaxed">
                  <Markdown>{r.text}</Markdown>
                </div>
                <div className="text-[10px] text-odi-text-muted mt-1">
                  {formatTime(r.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export function AquariumView() {
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const user = useAppSelector((s) => s.auth.user)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const isAdmin = user?.role === 'admin'

  const chatStreams = Object.values(streamingMessages)
  const { reflections, streams: reflectionStreams } = useReflections(sessionId)

  const botData = useMemo(() => {
    return sessionBots.map((bot) => {
      const participant = participants.find(
        (p) => p.botConfigId === bot.id || p.botSpecialistId === bot.specialistId,
      )
      const botMessages = participant
        ? messages.filter((m) => m.role === 'bot' && m.participantId === participant.id)
        : messages.filter((m) => m.role === 'bot' && m.author === bot.name)
      const activeStream = chatStreams.find(
        (s) => s.botConfigId === bot.id || s.botConfigId === bot.specialistId,
      )
      const botReflections = reflections.filter((r) => r.botConfigId === bot.id)
      const activeReflectionStream = reflectionStreams.find(
        (s) => s.botConfigId === bot.id || s.botConfigId === bot.specialistId,
      )
      return { bot, participant, messages: botMessages, activeStream, botReflections, activeReflectionStream }
    })
  }, [sessionBots, messages, participants, chatStreams, reflections, reflectionStreams])

  if (sessionBots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <NonIdealState
          icon="eye-open"
          title="Нет ботов в сессии"
          description="Боты появятся здесь, когда будут добавлены в сессию"
        />
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <Icon icon="eye-open" className="text-odi-accent" />
        <h2 className="text-lg font-bold text-odi-text">Аквариум</h2>
      </div>
      <p className="text-sm text-odi-text-muted mb-5">
        Наблюдайте за AI-агентами в реальном времени
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {botData.map(({ bot, participant, messages: botMsgs, activeStream, botReflections, activeReflectionStream }) => (
          <BotCard
            key={bot.id}
            bot={bot}
            isOnline={participant?.isOnline ?? false}
            totalMessages={botMsgs.length}
            lastMessages={botMsgs.slice(-5)}
            activeStream={activeStream}
            botReflections={botReflections}
            activeReflectionStream={activeReflectionStream}
            sessionId={sessionId}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}
