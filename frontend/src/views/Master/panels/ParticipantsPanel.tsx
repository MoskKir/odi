import { Card, Tag } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

const ROLE_LABELS: Record<string, string> = {
  host: 'Хост',
  bot: 'AI',
  participant: 'Участник',
}

export function ParticipantsPanel() {
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const onlineCount = participants.filter((p) => p.isOnline).length

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">Участники</span>
        <Tag minimal className="text-[10px]">{onlineCount}/{participants.length} онлайн</Tag>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {participants.length === 0 && (
          <div className="text-xs text-odi-text-muted text-center py-4">Нет участников</div>
        )}
        {participants.map((p) => {
          const isBot = p.role === 'bot'
          const name = isBot ? p.botName || 'Bot' : p.userName || 'User'
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-1.5 rounded text-sm hover:bg-odi-surface-hover ${
                !p.isOnline ? 'opacity-40' : ''
              }`}
            >
              <div className="relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isBot ? 'bg-odi-energy' : 'bg-odi-accent'
                  }`}
                >
                  {isBot ? '\u{1F916}' : name[0]?.toUpperCase()}
                </div>
                {p.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-odi-success border-2 border-odi-surface" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-odi-text truncate font-medium">{name}</div>
                <div className="text-[10px] text-odi-text-muted">
                  {ROLE_LABELS[p.role] || p.role} &middot; {p.contributionsCount} msg
                </div>
              </div>
              {p.currentEmotion && <span className="text-sm">{p.currentEmotion}</span>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
