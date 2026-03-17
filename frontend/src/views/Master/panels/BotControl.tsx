import { Card, Button, Tag, Switch } from '@blueprintjs/core'
import { useState } from 'react'

interface BotState {
  id: string
  name: string
  active: boolean
  strategy: string
  lastAction: string
  confidence: number
}

const INITIAL_BOTS: BotState[] = [
  { id: '1', name: 'Модератор', active: true, strategy: 'Давить на результат, время уходит', lastAction: 'Предложил голосование', confidence: 0.85 },
  { id: '2', name: 'Критик', active: true, strategy: 'Ждёт слабую идею для атаки', lastAction: 'Раскритиковал бюджет', confidence: 0.72 },
  { id: '3', name: 'Аналитик', active: false, strategy: 'Подготовка статистики', lastAction: 'Вывел цифры по рынку', confidence: 0.68 },
]

export function BotControl() {
  const [bots, setBots] = useState(INITIAL_BOTS)

  const toggle = (id: string) => {
    setBots((prev) => prev.map((b) => b.id === id ? { ...b, active: !b.active } : b))
  }

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider mb-2">Управление ботами</span>
      <div className="flex-1 overflow-y-auto space-y-2">
        {bots.map((bot) => (
          <div key={bot.id} className={`p-2 rounded border border-odi-border ${bot.active ? 'bg-odi-surface-hover' : 'opacity-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{'\u{1F916}'}</span>
                <span className="text-xs font-bold text-odi-text">{bot.name}</span>
                <Tag minimal intent={bot.active ? 'success' : 'none'} className="text-[9px]">
                  {bot.active ? 'ON' : 'OFF'}
                </Tag>
              </div>
              <Switch checked={bot.active} onChange={() => toggle(bot.id)} className="!mb-0" />
            </div>
            {bot.active && (
              <>
                <div className="text-[10px] text-odi-accent mb-0.5">
                  Стратегия: {bot.strategy}
                </div>
                <div className="text-[10px] text-odi-text-muted">
                  Последнее: {bot.lastAction}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button icon="refresh" minimal small className="text-[10px]" title="Сменить стратегию" />
                  <Button icon="chat" minimal small className="text-[10px]" title="Попросить высказаться" />
                  <Button icon="hand" minimal small className="text-[10px]" title="Замолчать" />
                  <span className="text-[10px] text-odi-text-muted ml-auto">
                    {Math.round(bot.confidence * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
