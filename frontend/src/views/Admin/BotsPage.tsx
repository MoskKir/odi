import { Card, Tag, Switch, Button } from '@blueprintjs/core'
import { useState } from 'react'

interface BotConfig {
  id: string
  name: string
  description: string
  personality: string
  enabled: boolean
  usageCount: number
  avgRating: number
  model: string
}

const MOCK_BOTS: BotConfig[] = [
  { id: '1', name: 'Модератор', description: 'Ведёт дискуссию, распределяет время', personality: 'Дипломатичный, структурированный', enabled: true, usageCount: 342, avgRating: 4.7, model: 'claude-sonnet' },
  { id: '2', name: 'Критик', description: 'Проверяет идеи, задаёт трудные вопросы', personality: 'Скептичный, аналитичный', enabled: true, usageCount: 289, avgRating: 4.3, model: 'claude-sonnet' },
  { id: '3', name: 'Визионер', description: 'Генерирует креативные идеи', personality: 'Творческий, вдохновляющий', enabled: true, usageCount: 256, avgRating: 4.5, model: 'claude-opus' },
  { id: '4', name: 'Аналитик', description: 'Работает с цифрами и фактами', personality: 'Точный, методичный', enabled: true, usageCount: 178, avgRating: 4.1, model: 'claude-sonnet' },
  { id: '5', name: 'Миротворец', description: 'Сглаживает конфликты', personality: 'Эмпатичный, мягкий', enabled: true, usageCount: 145, avgRating: 4.6, model: 'claude-sonnet' },
  { id: '6', name: 'Провокатор', description: 'Расшатывает рамки, будит креатив', personality: 'Дерзкий, провоцирующий', enabled: false, usageCount: 89, avgRating: 3.8, model: 'claude-sonnet' },
  { id: '7', name: 'Хранитель', description: 'Память сессии, контекст', personality: 'Внимательный, точный', enabled: true, usageCount: 134, avgRating: 4.2, model: 'claude-haiku' },
  { id: '8', name: 'Эксперт', description: 'Глубокий анализ предметной области', personality: 'Глубокий, авторитетный', enabled: true, usageCount: 67, avgRating: 4.8, model: 'claude-opus' },
]

export function BotsPage() {
  const [bots, setBots] = useState(MOCK_BOTS)

  const toggleBot = (id: string) => {
    setBots((prev) => prev.map((b) => b.id === id ? { ...b, enabled: !b.enabled } : b))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">AI-боты</h2>
        <div className="flex items-center gap-2">
          <Tag minimal>{bots.filter((b) => b.enabled).length} активных</Tag>
          <Button icon="plus" intent="success" text="Создать бота" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bots.map((bot) => (
          <Card key={bot.id} className={`!shadow-none !border-odi-border ${bot.enabled ? '!bg-odi-surface' : '!bg-odi-surface opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{'\u{1F916}'}</span>
                <div>
                  <div className="font-bold text-odi-text">{bot.name}</div>
                  <div className="text-xs text-odi-text-muted">{bot.description}</div>
                </div>
              </div>
              <Switch
                checked={bot.enabled}
                onChange={() => toggleBot(bot.id)}
                className="!mb-0"
              />
            </div>
            <div className="text-xs text-odi-text-muted mb-3">
              <span className="font-medium text-odi-text-muted">Личность:</span> {bot.personality}
            </div>
            <div className="flex items-center gap-3 text-xs text-odi-text-muted">
              <Tag minimal className="text-[10px]">{bot.model}</Tag>
              <span>{bot.usageCount} использований</span>
              <span>{'\u2605'} {bot.avgRating}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
