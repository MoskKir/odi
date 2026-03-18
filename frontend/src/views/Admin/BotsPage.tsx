import { Card, Tag, Switch, Button, Spinner, NonIdealState } from '@blueprintjs/core'
import { useState, useEffect } from 'react'
import { fetchBots, type BotResponse } from '@/api/bots'

export function BotsPage() {
  const [bots, setBots] = useState<BotResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchBots()
      .then((data) => { if (!cancelled) setBots(data) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить ботов') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

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

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={() => window.location.reload()} />}
        />
      ) : bots.length === 0 ? (
        <NonIdealState icon="cube" title="Нет ботов" description="Создайте первого бота" />
      ) : (
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
                {bot.tag && <Tag minimal intent="primary" className="text-[10px]">{bot.tag}</Tag>}
                <span>{bot.usageCount} использований</span>
                <span>{'\u2605'} {bot.avgRating}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
