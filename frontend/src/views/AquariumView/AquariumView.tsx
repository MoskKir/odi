import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Eye, MessageSquare, Minimize2, Maximize2, LayoutGrid,
  X, Check, Pencil, RefreshCw, Square, Sun,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setAquariumFocusedBotId, setAquariumBotTab } from '@/store/appSlice'
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

async function loadReflections(sessionId: string): Promise<Reflection[]> {
  const token = localStorage.getItem('odi_token')
  const res = await fetch(`/api/games/${sessionId}/messages/reflections`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return []
  return res.json()
}

function useReflections(sessionId: string) {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [streams, setStreams] = useState<Record<string, ReflectionStream>>({})
  const [pendingStreams, setPendingStreams] = useState<Record<string, ReflectionStream>>({})

  useEffect(() => {
    if (!sessionId) return
    loadReflections(sessionId).then((data) => setReflections(data.reverse()))
  }, [sessionId])

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
    const onEnd = (data: { streamId: string; stopped?: boolean }) => {
      setStreams((prev) => {
        const stream = prev[data.streamId]
        if (stream && !data.stopped) {
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

  const allStreams = [...Object.values(streams), ...Object.values(pendingStreams)]
  return { reflections, streams: allStreams }
}

// -- BotCard --

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
  expanded: boolean
  onToggleExpand: () => void
  tab: string
  onTabChange: (tab: string) => void
}

async function saveReflectionPrompt(botId: string, prompt: string) {
  const token = localStorage.getItem('odi_token')
  await fetch(`/api/bots/${botId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ reflectionPrompt: prompt }),
  })
}

function BotCard({
  bot, isOnline, totalMessages, lastMessages, activeStream,
  botReflections, activeReflectionStream, sessionId, isAdmin,
  expanded, onToggleExpand, tab, onTabChange,
}: BotCardProps) {
  const [reflectionPrompt, setReflectionPrompt] = useState(bot.reflectionPrompt || DEFAULT_REFLECTION_PROMPT)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const handleStopReflection = useCallback(() => {
    if (!activeReflectionStream || !sessionId) return
    const socket = getSocket()
    socket?.emit('chat:stop-stream', {
      sessionId,
      streamId: activeReflectionStream.streamId,
    })
  }, [activeReflectionStream, sessionId])

  const isGenerating = !!activeReflectionStream
  const isStreaming = isGenerating && !activeReflectionStream?.done
  const messagesLimit = expanded ? 20 : 5
  const contentMaxH = expanded ? 'max-h-none' : 'max-h-[300px]'

  return (
    <Card className={`bg-card border-border shadow-none flex flex-col p-4 ${expanded ? 'h-full' : ''}`}>
      {/* Bot header */}
      <div className="flex items-center gap-3 mb-2">
        <ChatAvatar name={bot.name} role={bot.specialistId} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">{bot.name}</span>
            <Badge variant={isOnline ? 'success' : 'outline'} className="text-[10px]">
              {isOnline ? 'online' : 'offline'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground truncate">{bot.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center">
            <MessageSquare className="h-2.5 w-2.5 mr-1" />
            {totalMessages}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
            title={expanded ? 'Свернуть' : 'Развернуть'}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={onTabChange} className="mb-3">
        <TabsList className="bg-transparent border-b border-border/50 w-full justify-start rounded-none h-auto p-0">
          <TabsTrigger
            value="messages"
            className="text-xs text-muted-foreground py-1.5 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <MessageSquare className="h-3 w-3 mr-1" /> Сообщения
          </TabsTrigger>
          <TabsTrigger
            value="reflection"
            className="text-xs text-muted-foreground py-1.5 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Sun className="h-3 w-3 mr-1" /> Рефлексия
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-3">
          {activeStream && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-accent border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
                </span>
                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Генерирует ответ</span>
              </div>
              <div className="text-sm text-foreground break-words leading-relaxed">
                <Markdown>{activeStream.text}</Markdown>
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse rounded-sm align-text-bottom" />
              </div>
            </div>
          )}
          <div className={`flex-1 space-y-2 overflow-y-auto ${contentMaxH}`}>
            {lastMessages.length === 0 && !activeStream && (
              <div className="text-xs text-muted-foreground italic text-center py-4">Бот ещё не высказывался</div>
            )}
            {lastMessages.slice(-messagesLimit).map((msg) => (
              <div key={msg.id} className="px-3 py-2 rounded-lg bg-background/50 border border-border/50">
                <div className="text-sm text-foreground break-words leading-relaxed"><Markdown>{msg.text}</Markdown></div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {formatTime(msg.timestamp)}
                  {msg.isEdited && <span className="ml-1 italic">(ред.)</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reflection" className="mt-3">
          <div className="flex flex-col gap-3 flex-1">
            {isAdmin ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Промпт рефлексии</span>
                  {isEditingPrompt ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        setReflectionPrompt(bot.reflectionPrompt || DEFAULT_REFLECTION_PROMPT)
                        setIsEditingPrompt(false)
                      }}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-success" disabled={saving} onClick={async () => {
                        setSaving(true)
                        try {
                          await saveReflectionPrompt(bot.id, reflectionPrompt)
                          bot.reflectionPrompt = reflectionPrompt
                        } catch { /* ignore */ }
                        setSaving(false)
                        setIsEditingPrompt(false)
                      }}>
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingPrompt(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingPrompt ? (
                  <Textarea
                    value={reflectionPrompt}
                    onChange={(e) => setReflectionPrompt(e.target.value)}
                    className="bg-background text-foreground border-border text-xs w-full"
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-xs text-muted-foreground italic">{reflectionPrompt}</div>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-xs text-muted-foreground italic">{reflectionPrompt}</div>
            )}

            {isStreaming ? (
              <Button variant="destructive" onClick={handleStopReflection}>
                <Square className="h-4 w-4 mr-1" /> Остановить рефлексию
              </Button>
            ) : (
              <Button onClick={handleReflect} disabled={!socketJoined || isGenerating}>
                <RefreshCw className="h-4 w-4 mr-1" /> Запросить рефлексию
              </Button>
            )}

            {activeReflectionStream && (
              <div className="px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 animate-fade-in">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="relative flex h-2 w-2">
                    {!activeReflectionStream.done && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                  </span>
                  <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">
                    {activeReflectionStream.done ? 'Сохранение...' : 'Рефлексия...'}
                  </span>
                </div>
                <div className="text-sm text-foreground break-words leading-relaxed">
                  <Markdown>{activeReflectionStream.text}</Markdown>
                  {!activeReflectionStream.done && <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-500 animate-pulse rounded-sm align-text-bottom" />}
                </div>
              </div>
            )}

            <div className={`flex-1 space-y-2 overflow-y-auto ${contentMaxH}`}>
              {botReflections.length === 0 && !activeReflectionStream && (
                <div className="text-xs text-muted-foreground italic text-center py-4">Рефлексий пока нет</div>
              )}
              {botReflections.map((r) => (
                <div key={r.id} className="px-3 py-2 rounded-lg bg-background/50 border border-violet-500/20">
                  <div className="text-sm text-foreground break-words leading-relaxed"><Markdown>{r.text}</Markdown></div>
                  <div className="text-[10px] text-muted-foreground mt-1">{formatTime(r.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

// -- AquariumView --

export function AquariumView() {
  const dispatch = useAppDispatch()
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const user = useAppSelector((s) => s.auth.user)
  const focusedBotId = useAppSelector((s) => s.app.aquariumFocusedBotId)
  const botTabs = useAppSelector((s) => s.app.aquariumBotTabs)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const isAdmin = user?.role === 'admin'

  // Transition state
  const [, setTransitioning] = useState(false)
  const [visible, setVisible] = useState(true)

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

  const handleFocus = useCallback((botId: string | null) => {
    setVisible(false)
    setTransitioning(true)
    setTimeout(() => {
      dispatch(setAquariumFocusedBotId(botId))
      setVisible(true)
      setTimeout(() => setTransitioning(false), 300)
    }, 150)
  }, [dispatch])

  const handleTabChange = useCallback((botId: string, tab: string) => {
    dispatch(setAquariumBotTab({ botId, tab }))
  }, [dispatch])

  if (sessionBots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Eye className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Нет ботов в сессии</h2>
          <p className="text-sm text-muted-foreground">Боты появятся здесь, когда будут добавлены в сессию</p>
        </div>
      </div>
    )
  }

  const focusedBot = focusedBotId ? botData.find((d) => d.bot.id === focusedBotId) : null

  const contentClass = `transition-all duration-300 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`

  // Focused mode
  if (focusedBot) {
    return (
      <div className="p-4 h-full flex flex-col overflow-hidden">
        {/* Bot switcher strip */}
        <div className={`flex items-center gap-2 mb-3 shrink-0 ${contentClass}`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => handleFocus(null)}
            title="Показать все"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border/50" />
          <div className="flex gap-0.5">
            {botData.map((d) => {
              const isActive = d.bot.id === focusedBotId
              const hasActivity = !!d.activeStream || !!d.activeReflectionStream
              return (
                <Button
                  key={d.bot.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (d.bot.id !== focusedBotId) handleFocus(d.bot.id)
                  }}
                  className={`text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                >
                  <span className="flex items-center gap-1.5">
                    <ChatAvatar name={d.bot.name} role={d.bot.specialistId} size="sm" />
                    {d.bot.name}
                    {hasActivity && <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Full-screen card */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${contentClass}`}>
          <BotCard
            bot={focusedBot.bot}
            isOnline={focusedBot.participant?.isOnline ?? false}
            totalMessages={focusedBot.messages.length}
            lastMessages={focusedBot.messages.slice(-20)}
            activeStream={focusedBot.activeStream}
            botReflections={focusedBot.botReflections}
            activeReflectionStream={focusedBot.activeReflectionStream}
            sessionId={sessionId}
            isAdmin={isAdmin}
            expanded
            onToggleExpand={() => handleFocus(null)}
            tab={botTabs[focusedBot.bot.id] || 'messages'}
            onTabChange={(t) => handleTabChange(focusedBot.bot.id, t)}
          />
        </div>
      </div>
    )
  }

  // Grid mode
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className={`flex items-center gap-2 mb-1 ${contentClass}`}>
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Аквариум</h2>
      </div>
      <p className={`text-sm text-muted-foreground mb-5 ${contentClass}`}>
        Наблюдайте за AI-агентами в реальном времени
      </p>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${contentClass}`}>
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
            expanded={false}
            onToggleExpand={() => handleFocus(bot.id)}
            tab={botTabs[bot.id] || 'messages'}
            onTabChange={(t) => handleTabChange(bot.id, t)}
          />
        ))}
      </div>
    </div>
  )
}
