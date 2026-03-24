import { useRef, useEffect, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'
import { ChatAvatar } from '@/components/ChatAvatar'
import { MessageContextMenu } from '@/components/Chat/MessageContextMenu'
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu'

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function TheatreView() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const currentUser = useAppSelector((s) => s.auth.user)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const { contextMenu, handleContextMenu, closeContextMenu } = useMessageContextMenu()

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

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <ChatAvatar name={msg.author} role={msg.role} isMine={isMine} />

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
                  {msg.role === 'bot' ? <Markdown>{msg.text}</Markdown> : msg.text}
                </div>
                <div className={`text-[10px] text-odi-text-muted mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                  {msg.isEdited && <span className="ml-1 italic">(ред.)</span>}
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
