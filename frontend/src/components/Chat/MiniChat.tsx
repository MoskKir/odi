import { useAppSelector } from '@/store'

export function MiniChat() {
  const messages = useAppSelector((s) => s.app.messages)
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
            <span className="text-odi-text-muted whitespace-pre-wrap break-words">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
