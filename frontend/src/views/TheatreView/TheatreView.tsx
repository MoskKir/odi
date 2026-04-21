import { useRef, useEffect, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowDown, Trash2, RotateCcw } from 'lucide-react'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'
import { ChatAvatar } from '@/components/ChatAvatar'
import { MessageContextMenu } from '@/components/Chat/MessageContextMenu'
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu'
import { getSocket } from '@/api/socket'

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Reliable truncation signal: odd number of ** means an unclosed bold span.
 * Single * is intentionally ignored — list items (bullet points) would cause false positives.
 */
function looksIncomplete(text: string): boolean {
  const t = text.trimEnd()
  if (!t || t.length < 20) return false
  return (t.match(/\*\*/g) || []).length % 2 !== 0
}

export function TheatreView() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const sessionParticipants = useAppSelector((s) => s.app.sessionParticipants)
  const currentUser = useAppSelector((s) => s.auth.user)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [continuingSent, setContinuingSent] = useState<string | null>(null)
  const { contextMenu, handleContextMenu, closeContextMenu } = useMessageContextMenu()

  const streams = Object.values(streamingMessages)

  // Index of the last bot message (to always show the continue button on it)
  const lastBotMsgId = [...messages].reverse().find((m) => m.role === 'bot')?.id

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    shouldAutoScroll.current = atBottom
    if (atBottom) setShowScrollDown(false)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
    shouldAutoScroll.current = true
    setShowScrollDown(false)
  }, [])

  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    } else if (!shouldAutoScroll.current && (messages.length > 0 || streams.length > 0)) {
      setShowScrollDown(true)
    }
  }, [messages, streams])

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex flex-col gap-3 p-4 h-full overflow-y-auto w-full"
      >
        {messages.map((msg) => {
          const isMine = currentUser?.name === msg.author
          const isDeleted = msg.text.startsWith('\u26A0 Сообщение')

          if (isDeleted) {
            return (
              <div key={msg.id} className="flex justify-center my-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/30">
                  <Trash2 className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground/60 italic">{msg.text.replace('\u26A0 ', '')}</span>
                </div>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`group flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <ChatAvatar name={msg.author} role={msg.role} isMine={isMine} />

              {/* Message bubble */}
              <div className={`max-w-[70%] min-w-[120px]`}>
                {!isMine && (
                  <div className="text-xs font-medium mb-1 text-muted-foreground">
                    {msg.author}
                  </div>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <Markdown>{msg.text}</Markdown>
                </div>
                <div className={`flex items-center gap-2 text-[10px] text-muted-foreground mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.isEdited && <span className="italic">(ред.)</span>}
                  {msg.role === 'bot' && !isMine && (() => {
                    const participant = sessionParticipants.find((p) => p.id === msg.participantId)
                    const botConfigId = participant?.botConfigId
                      ?? sessionBots.find((b) => b.name === msg.author)?.id
                    if (!botConfigId || !sessionId) return null
                    const incomplete = looksIncomplete(msg.text)
                    const isLast = msg.id === lastBotMsgId
                    const alwaysVisible = isLast && (incomplete || streams.length === 0)
                    const sent = continuingSent === msg.id
                    return (
                      <button
                        disabled={sent}
                        className={`transition-opacity flex items-center gap-0.5 hover:text-foreground disabled:cursor-default ${
                          sent ? 'opacity-60 text-muted-foreground' :
                          alwaysVisible
                            ? incomplete ? 'opacity-100 text-warning' : 'opacity-60 text-muted-foreground'
                            : 'opacity-0 group-hover:opacity-60 text-muted-foreground'
                        }`}
                        title={incomplete ? 'Ответ похоже оборвался — продолжить?' : 'Продолжить ответ'}
                        onClick={() => {
                          const sock = getSocket()
                          if (!sock) return
                          sock.emit('bot:speak', {
                            sessionId,
                            botConfigId,
                            prompt: 'Продолжи свой предыдущий ответ с того места, где он прервался. Не повторяй уже написанное — начинай прямо с продолжения.',
                          })
                          setContinuingSent(msg.id)
                          setTimeout(() => setContinuingSent(null), 10000)
                        }}
                      >
                        <RotateCcw className={`h-2.5 w-2.5 ${sent ? 'animate-spin' : ''}`} />
                        {sent ? 'отправлено...' : incomplete && isLast ? 'ответ оборвался — продолжить' : 'продолжить'}
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })}

        {/* Streaming messages (typing in real-time) */}
        {streams.map((stream) => {
          const bot = sessionBots.find((b) => b.id === stream.botConfigId || b.specialistId === stream.botConfigId)
          const botName = bot?.name || stream.botConfigId
          const role = bot?.specialistId || 'moderator'

          return (
            <div key={stream.streamId} className="flex items-end gap-2 flex-row">
              <ChatAvatar name={botName} role={role} />
              <div className="max-w-[70%] min-w-[120px]">
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  {botName}
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words bg-muted text-foreground">
                  {stream.ended
                    ? <Markdown>{stream.text}</Markdown>
                    : <span className="whitespace-pre-wrap">{stream.text}</span>
                  }
                  {!stream.ended && <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse rounded-sm align-text-bottom" />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showScrollDown && (
        <Button
          size="icon"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}

      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          sessionId={sessionId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
