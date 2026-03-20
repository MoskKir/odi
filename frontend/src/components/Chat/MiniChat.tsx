import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'

export function MiniChat() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const streams = Object.values(streamingMessages)
  const lastMessages = messages.slice(-3)

  return (
    <div>
      <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
        Мини-чат
      </div>
      <div className="space-y-1">
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
      </div>
    </div>
  )
}
