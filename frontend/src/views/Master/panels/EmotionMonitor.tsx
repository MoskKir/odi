import { Flame, Zap, Lightbulb, Battery, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface EmotionStat {
  label: string
  icon: LucideIcon
  value: number
  indicatorClassName?: string
  variant: 'success' | 'warning' | 'danger' | 'default'
}

const EMOTIONS: EmotionStat[] = [
  { label: 'Вовлечённость', icon: Flame, value: 0.78, indicatorClassName: 'bg-green-500', variant: 'success' },
  { label: 'Напряжение', icon: Zap, value: 0.35, indicatorClassName: 'bg-yellow-500', variant: 'warning' },
  { label: 'Креативность', icon: Lightbulb, value: 0.62, variant: 'default' },
  { label: 'Усталость', icon: Battery, value: 0.22, indicatorClassName: 'bg-red-500', variant: 'danger' },
]

const ALERTS = [
  { text: 'Дмитрий молчит 15 мин', variant: 'warning' as const },
  { text: 'Команда теряет энергию', variant: 'danger' as const },
]

export function EmotionMonitor() {
  return (
    <Card className="bg-card border-border shadow-none h-full flex flex-col overflow-hidden p-3">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Эмоциональный монитор</span>

      <div className="flex-1 overflow-y-auto space-y-2">
        {EMOTIONS.map((em) => {
          const Icon = em.icon
          return (
          <div key={em.label}>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span className="flex items-center gap-1"><Icon className="h-3 w-3" /> {em.label}</span>
              <span>{Math.round(em.value * 100)}%</span>
            </div>
            <Progress
              value={em.value * 100}
              indicatorClassName={em.indicatorClassName}
            />
          </div>
          )
        })}

        {ALERTS.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Сигналы</span>
            {ALERTS.map((a, i) => (
              <Badge key={i} variant={a.variant} className="text-[10px] w-full justify-start">{a.text}</Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
