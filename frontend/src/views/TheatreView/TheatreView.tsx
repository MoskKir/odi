import { Card, Tag } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

const ROLE_COLORS: Record<string, string> = {
  moderator: 'bg-odi-accent',
  critic: 'bg-odi-danger',
  visionary: 'bg-odi-energy',
  user: 'bg-odi-success',
}

export function TheatreView() {
  const messages = useAppSelector((s) => s.app.messages)

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto max-w-3xl mx-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
              ROLE_COLORS[msg.role] || 'bg-odi-text-muted'
            }`}
          >
            {msg.role === 'user' ? 'Вы' : 'AI'}
          </div>
          <Card
            className={`!shadow-none !border-odi-border max-w-[70%] ${
              msg.role === 'user'
                ? '!bg-odi-accent/10'
                : '!bg-odi-surface-hover'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-odi-text">{msg.author}</span>
              <Tag minimal round className="text-[10px]">
                {msg.role}
              </Tag>
            </div>
            <p className="text-sm text-odi-text-muted">{msg.text}</p>
          </Card>
        </div>
      ))}
    </div>
  )
}
