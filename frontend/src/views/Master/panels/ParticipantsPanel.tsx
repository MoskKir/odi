import { useAppSelector } from '@/store'
import { Bot } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ROLE_LABELS: Record<string, string> = {
  host: 'Хост',
  bot: 'AI',
  participant: 'Участник',
}

export function ParticipantsPanel() {
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const onlineCount = participants.filter((p) => p.isOnline).length

  return (
    <Card className="bg-card border-border shadow-none h-full flex flex-col overflow-hidden p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Участники</span>
        <Badge variant="outline" className="text-[10px]">{onlineCount}/{participants.length} онлайн</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {participants.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">Нет участников</div>
        )}
        {participants.map((p) => {
          const isBot = p.role === 'bot'
          const name = isBot ? p.botName || 'Bot' : p.userName || 'User'
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 p-1.5 rounded text-sm hover:bg-muted ${
                !p.isOnline ? 'opacity-40' : ''
              }`}
            >
              <div className="relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isBot ? 'bg-energy' : 'bg-primary'
                  }`}
                >
                  {isBot ? <Bot className="h-3.5 w-3.5" /> : name[0]?.toUpperCase()}
                </div>
                {p.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate font-medium">{name}</div>
                <div className="text-[10px] text-muted-foreground">
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
