import { Card, Tag, Button } from '@blueprintjs/core'

interface Participant {
  id: string
  name: string
  role: string
  isBot: boolean
  online: boolean
  speaking: boolean
  emotion: string
  contributions: number
}

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Анна К.', role: 'Капитан', isBot: false, online: true, speaking: true, emotion: '\u{1F60A}', contributions: 12 },
  { id: '2', name: 'Борис М.', role: 'Участник', isBot: false, online: true, speaking: false, emotion: '\u{1F914}', contributions: 8 },
  { id: '3', name: 'Елена В.', role: 'Участник', isBot: false, online: true, speaking: false, emotion: '\u{1F60C}', contributions: 5 },
  { id: '4', name: 'Дмитрий С.', role: 'Участник', isBot: false, online: false, speaking: false, emotion: '', contributions: 3 },
  { id: '5', name: 'Модератор', role: 'AI', isBot: true, online: true, speaking: false, emotion: '', contributions: 15 },
  { id: '6', name: 'Критик', role: 'AI', isBot: true, online: true, speaking: false, emotion: '', contributions: 9 },
]

export function ParticipantsPanel() {
  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">Участники</span>
        <Tag minimal className="text-[10px]">{PARTICIPANTS.filter((p) => p.online).length} онлайн</Tag>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {PARTICIPANTS.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 p-1.5 rounded text-sm ${
              p.speaking ? 'bg-odi-accent/10' : 'hover:bg-odi-surface-hover'
            } ${!p.online ? 'opacity-40' : ''}`}
          >
            <div className="relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                p.isBot ? 'bg-odi-energy' : 'bg-odi-accent'
              }`}>
                {p.isBot ? '\u{1F916}' : p.name[0]}
              </div>
              {p.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-odi-success border-2 border-odi-surface" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs text-odi-text truncate font-medium">{p.name}</span>
                {p.speaking && <span className="text-[9px] text-odi-accent">{'\u{1F50A}'}</span>}
              </div>
              <div className="text-[10px] text-odi-text-muted">{p.role} &middot; {p.contributions} msg</div>
            </div>
            {p.emotion && <span className="text-sm">{p.emotion}</span>}
            <Button icon="more" minimal small className="!opacity-0 group-hover:!opacity-100" />
          </div>
        ))}
      </div>
    </Card>
  )
}
