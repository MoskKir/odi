import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'

export function MiniChat() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const streams = Object.values(streamingMessages)
  const lastMessages = messages.slice(-3)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lastMessages, streams])

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2 shrink-0">
        Мини-чат
      </div>
      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {lastMessages.map((msg) => (
          <div key={msg.id} className="text-xs p-1.5 rounded bg-odi-surface-hover">
            <span className="text-odi-accent font-medium">{msg.author}:</span>{' '}
            <span className="text-odi-text-muted break-words"><Markdown>{msg.text}</Markdown></span>
          </div>
        ))}
        {streams.map((stream) => (
          <div key={stream.streamId} className="text-xs p-1.5 rounded bg-odi-surface-hover">
            <span className="text-odi-accent font-medium">{stream.botConfigId}:</span>{' '}
            <span className="text-odi-text-muted break-words">
              <Markdown>{stream.text}</Markdown>
              <span className="inline-block w-1 h-3 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" />
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
