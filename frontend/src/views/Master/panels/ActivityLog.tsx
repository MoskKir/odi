import { Card, Tag } from '@blueprintjs/core'

interface LogEntry {
  id: string
  time: string
  type: 'phase' | 'bot' | 'player' | 'system' | 'emotion'
  text: string
}

const LOG_ENTRIES: LogEntry[] = [
  { id: '1', time: '14:49', type: 'bot', text: 'Модератор предложил голосование' },
  { id: '2', time: '14:48', type: 'player', text: 'Елена поддержала идею Бориса' },
  { id: '3', time: '14:48', type: 'player', text: 'Борис предложил поэтапный подход' },
  { id: '4', time: '14:47', type: 'bot', text: 'Критик оспорил бюджет' },
  { id: '5', time: '14:46', type: 'player', text: 'Анна начала обсуждение велодорожек' },
  { id: '6', time: '14:45', type: 'phase', text: 'Началась фаза "Критический анализ"' },
  { id: '7', time: '14:44', type: 'emotion', text: 'Вовлечённость команды +12%' },
  { id: '8', time: '14:40', type: 'system', text: 'Дмитрий отключился' },
  { id: '9', time: '14:35', type: 'phase', text: 'Завершена фаза "Генерация идей"' },
  { id: '10', time: '14:30', type: 'bot', text: 'Аналитик отключён мастером' },
]

const TYPE_CONFIG: Record<string, { color: string; prefix: string }> = {
  phase: { color: 'text-odi-accent', prefix: '\u{23F1}' },
  bot: { color: 'text-odi-energy', prefix: '\u{1F916}' },
  player: { color: 'text-odi-success', prefix: '\u{1F464}' },
  system: { color: 'text-odi-text-muted', prefix: '\u{2699}' },
  emotion: { color: 'text-odi-warning', prefix: '\u{1F4CA}' },
}

export function ActivityLog() {
  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">Лог активности</span>
        <Tag minimal className="text-[10px]">{LOG_ENTRIES.length}</Tag>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {LOG_ENTRIES.map((entry) => {
          const cfg = TYPE_CONFIG[entry.type]
          return (
            <div key={entry.id} className="flex gap-2 text-[11px] py-0.5">
              <span className="text-odi-text-muted shrink-0 font-mono w-10">{entry.time}</span>
              <span className="shrink-0">{cfg.prefix}</span>
              <span className={cfg.color}>{entry.text}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
