import { useAppSelector } from '@/store'

export function TerminalView() {
  const messages = useAppSelector((s) => s.app.messages)

  return (
    <div className="p-4 h-full overflow-y-auto font-mono text-sm">
      <div className="text-odi-success mb-2">ODI Terminal v0.1 — Режим фокуса</div>
      <div className="border-b border-odi-border mb-3 pb-1 text-odi-text-muted">
        Введите команду или читайте лог сессии
      </div>
      {messages.map((msg) => (
        <div key={msg.id} className="mb-1">
          <span className="text-odi-accent">[{msg.role}]</span>{' '}
          <span className="text-odi-text-muted">{msg.author}:</span>{' '}
          <span className="text-odi-text whitespace-pre-wrap break-words">{msg.text}</span>
        </div>
      ))}
      <div className="mt-3 text-odi-success">
        {'>'} <span className="animate-pulse">_</span>
      </div>
    </div>
  )
}
