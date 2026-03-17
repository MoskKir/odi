import { Card, ProgressBar, Tag } from '@blueprintjs/core'

interface EmotionStat {
  label: string
  emoji: string
  value: number
  intent: 'success' | 'warning' | 'danger' | 'primary'
}

const EMOTIONS: EmotionStat[] = [
  { label: 'Вовлечённость', emoji: '\u{1F525}', value: 0.78, intent: 'success' },
  { label: 'Напряжение', emoji: '\u{26A1}', value: 0.35, intent: 'warning' },
  { label: 'Креативность', emoji: '\u{1F4A1}', value: 0.62, intent: 'primary' },
  { label: 'Усталость', emoji: '\u{1F634}', value: 0.22, intent: 'danger' },
]

const ALERTS = [
  { text: 'Дмитрий молчит 15 мин', intent: 'warning' as const },
  { text: 'Команда теряет энергию', intent: 'danger' as const },
]

export function EmotionMonitor() {
  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider mb-2">Эмоциональный монитор</span>

      <div className="flex-1 overflow-y-auto space-y-2">
        {EMOTIONS.map((em) => (
          <div key={em.label}>
            <div className="flex items-center justify-between text-[10px] text-odi-text-muted mb-0.5">
              <span>{em.emoji} {em.label}</span>
              <span>{Math.round(em.value * 100)}%</span>
            </div>
            <ProgressBar value={em.value} intent={em.intent} stripes={false} animate={false} />
          </div>
        ))}

        {ALERTS.length > 0 && (
          <div className="mt-2 pt-2 border-t border-odi-border space-y-1">
            <span className="text-[10px] font-bold text-odi-text-muted uppercase">Сигналы</span>
            {ALERTS.map((a, i) => (
              <Tag key={i} intent={a.intent} minimal fill className="text-[10px]">{a.text}</Tag>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
