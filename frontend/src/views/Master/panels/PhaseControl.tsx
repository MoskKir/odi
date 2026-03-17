import { Card, Button, Tag } from '@blueprintjs/core'
import { useState } from 'react'

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

const STATUS_ICON: Record<string, string> = {
  done: 'tick-circle',
  active: 'record',
  pending: 'circle',
}

export function PhaseControl() {
  const [phases] = useState(INITIAL_PHASES)
  const activeIndex = phases.findIndex((p) => p.status === 'active')

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none flex-1 flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">Фазы сессии</span>
        <Tag minimal className="text-[10px]">{activeIndex + 1}/{phases.length}</Tag>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`flex items-center gap-2 p-2 rounded text-sm ${
              phase.status === 'active'
                ? 'bg-odi-accent/15 text-odi-accent'
                : phase.status === 'done'
                  ? 'text-odi-text-muted'
                  : 'text-odi-text-muted opacity-60'
            }`}
          >
            <span className={`bp5-icon bp5-icon-${STATUS_ICON[phase.status]} text-xs`} />
            <span className={`flex-1 ${phase.status === 'active' ? 'font-medium' : ''} ${phase.status === 'done' ? 'line-through' : ''}`}>
              {phase.name}
            </span>
            <span className="text-[10px]">{phase.duration}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2 pt-2 border-t border-odi-border">
        <Button icon="arrow-left" small minimal disabled={activeIndex <= 0} className="flex-1" text="Назад" />
        <Button icon="arrow-right" small intent="primary" className="flex-1" text="Далее" />
      </div>
    </Card>
  )
}
