import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Disc } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Phase {
  id: string
  name: string
  duration: string
  status: 'done' | 'active' | 'pending'
}

const INITIAL_PHASES: Phase[] = [
  { id: '1', name: 'Разогрев', duration: '10 мин', status: 'done' },
  { id: '2', name: 'Генерация идей', duration: '25 мин', status: 'done' },
  { id: '3', name: 'Критический анализ', duration: '20 мин', status: 'active' },
  { id: '4', name: 'Голосование', duration: '10 мин', status: 'pending' },
  { id: '5', name: 'Проработка ТОП-3', duration: '15 мин', status: 'pending' },
  { id: '6', name: 'Итоги и рефлексия', duration: '10 мин', status: 'pending' },
]

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5" />
  if (status === 'active') return <Disc className="h-3.5 w-3.5" />
  return <Circle className="h-3.5 w-3.5" />
}

export function PhaseControl() {
  const [phases] = useState(INITIAL_PHASES)
  const activeIndex = phases.findIndex((p) => p.status === 'active')

  return (
    <Card className="bg-card border-border shadow-none flex-1 flex flex-col overflow-hidden p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Фазы сессии</span>
        <Badge variant="outline" className="text-[10px]">{activeIndex + 1}/{phases.length}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`flex items-center gap-2 p-2 rounded text-sm ${
              phase.status === 'active'
                ? 'bg-accent text-primary'
                : phase.status === 'done'
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground opacity-60'
            }`}
          >
            <StatusIcon status={phase.status} />
            <span className={`flex-1 ${phase.status === 'active' ? 'font-medium' : ''} ${phase.status === 'done' ? 'line-through' : ''}`}>
              {phase.name}
            </span>
            <span className="text-[10px]">{phase.duration}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" disabled={activeIndex <= 0} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <Button size="sm" className="flex-1">
          <ArrowRight className="h-4 w-4 mr-1" />
          Далее
        </Button>
      </div>
    </Card>
  )
}
