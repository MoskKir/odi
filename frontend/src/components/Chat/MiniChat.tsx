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

  if (lastMessages.length === 0 && streams.length === 0) {
    return (
      <p className="text-xs text-odi-text-muted italic">Нет сообщений</p>
    )
  }

  return (
    <div className="space-y-1.5">
      {lastMessages.map((msg) => (
        <div key={msg.id} className="text-xs px-2.5 py-2 rounded-md bg-odi-bg/50 border border-odi-border/50">
          <span className="text-odi-accent font-semibold">{msg.author}</span>
          <div className="text-odi-text mt-0.5 break-words leading-relaxed"><Markdown>{msg.text}</Markdown></div>
        </div>
      ))}
      {streams.map((stream) => (
        <div key={stream.streamId} className="text-xs px-2.5 py-2 rounded-md bg-odi-bg/50 border border-odi-accent/20">
          <span className="text-odi-accent font-semibold">{stream.botConfigId}</span>
          <div className="text-odi-text mt-0.5 break-words leading-relaxed">
            <Markdown>{stream.text}</Markdown>
            <span className="inline-block w-1 h-3 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" />
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
