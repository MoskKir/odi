import { useRef, useEffect, useCallback, useState } from 'react'
import { Button, Icon } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleColor(role: string) {
  switch (role) {
    case 'moderator':
      return 'bg-blue-600'
    case 'critic':
      return 'bg-red-600'
    case 'visionary':
      return 'bg-purple-600'
    default:
      return 'bg-odi-accent'
  }
}

function getRoleIcon(role: string): string | null {
  switch (role) {
    case 'moderator':
      return 'shield'
    case 'critic':
      return 'eye-open'
    case 'visionary':
      return 'lightbulb'
    default:
      return null
  }
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function TheatreView() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const currentUser = useAppSelector((s) => s.auth.user)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const streams = Object.values(streamingMessages)

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
          const isBot = msg.role === 'bot'
          const roleIcon = getRoleIcon(msg.role)

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar at the bottom of the message */}
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isMine ? 'bg-odi-accent' : getRoleColor(msg.role)
                }`}
                title={msg.author}
              >
                {isBot && roleIcon ? (
                  <Icon icon={roleIcon as any} size={14} className="text-white" />
                ) : (
                  getInitials(msg.author)
                )}
              </div>

              {/* Message bubble */}
              <div className={`max-w-[70%] min-w-[120px]`}>
                {!isMine && (
                  <div className="text-xs font-medium mb-1 text-odi-text-muted">
                    {msg.author}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? 'bg-odi-accent text-white rounded-br-md'
                      : 'bg-odi-surface-hover text-odi-text rounded-bl-md'
                  }`}
                >
                  {isBot ? <Markdown>{msg.text}</Markdown> : msg.text}
                </div>
                <div className={`text-[10px] text-odi-text-muted mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
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
          const roleIcon = getRoleIcon(role)

          return (
            <div key={stream.streamId} className="flex items-end gap-2 flex-row">
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getRoleColor(role)}`}
                title={botName}
              >
                {roleIcon ? (
                  <Icon icon={roleIcon as any} size={14} className="text-white" />
                ) : (
                  getInitials(botName)
                )}
              </div>
              <div className="max-w-[70%] min-w-[120px]">
                <div className="text-xs font-medium mb-1 text-odi-text-muted">
                  {botName}
                </div>
                <div className="px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words bg-odi-surface-hover text-odi-text">
                  <Markdown>{stream.text}</Markdown>
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showScrollDown && (
        <Button
          icon="arrow-down"
          intent="primary"
          className="!absolute bottom-4 left-1/2 -translate-x-1/2 !rounded-full !shadow-lg"
          onClick={scrollToBottom}
        />
      )}
    </div>
  )
}
