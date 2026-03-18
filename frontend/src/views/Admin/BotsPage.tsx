import { Card, Tag, Button, Icon, Spinner, NonIdealState, Popover } from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBots, createBot, deleteBot, type BotResponse } from '@/api/bots'

export function BotsPage() {
  const navigate = useNavigate()
  const [bots, setBots] = useState<BotResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const loadBots = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchBots()
      .then((data) => { if (!cancelled) setBots(data) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить ботов') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => loadBots(), [loadBots])

  const toggle = (id: string) => setExpandedId((prev) => prev === id ? null : id)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteBot(id)
      setBots((prev) => prev.filter((b) => b.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      setError('Не удалось удалить бота')
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (bot: BotResponse) => {
    setDuplicating(bot.id)
    try {
      const copy = await createBot({
        specialistId: `${bot.specialistId}-copy-${Date.now()}`,
        name: `${bot.name} (копия)`,
        description: bot.description,
        personality: bot.personality,
        systemPrompt: bot.systemPrompt ?? '',
        model: bot.model,
        enabled: false,
        stars: bot.stars,
        tag: bot.tag,
        temperature: bot.temperature ?? 0.7,
        maxTokens: bot.maxTokens ?? 4096,
      })
      setBots((prev) => [copy, ...prev])
    } catch {
      setError('Не удалось дублировать бота')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">AI-боты</h2>
        <div className="flex items-center gap-2">
          <Tag minimal>{bots.filter((b) => b.enabled).length} активных</Tag>
          <Button icon="plus" intent="success" text="Создать бота" onClick={() => navigate('/master/bots/new')} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={loadBots} />}
        />
      ) : bots.length === 0 ? (
        <NonIdealState icon="cube" title="Нет ботов" description="Создайте первого бота" />
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => {
            const isOpen = expandedId === bot.id
            return (
              <Card key={bot.id} className={`!shadow-none !border-odi-border !p-0 ${bot.enabled ? '!bg-odi-surface' : '!bg-odi-surface opacity-60'}`}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggle(bot.id)}
                  >
                    <Icon
                      icon="chevron-right"
                      className={`text-odi-text-muted mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <span className="text-2xl shrink-0">{'\u{1F916}'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-odi-text">{bot.name}</span>
                        <Tag minimal className="text-[10px]">{bot.model}</Tag>
                        {bot.tag && <Tag minimal intent="primary" className="text-[10px]">{bot.tag}</Tag>}
                        {!bot.enabled && <Tag minimal intent="warning" className="text-[10px]">Выключен</Tag>}
                      </div>
                      <div className={`text-sm text-odi-text-muted whitespace-pre-line ${isOpen ? '' : 'line-clamp-2'}`}>
                        {bot.description}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-odi-text-muted mt-2">
                        <span>Личность: {bot.personality}</span>
                        <span>{bot.usageCount} использований</span>
                        <span>{'\u2605'} {bot.avgRating}</span>
                      </div>
                      {isOpen && bot.systemPrompt && (
                        <div className="mt-3 p-2 rounded bg-odi-bg border border-odi-border">
                          <div className="text-[11px] text-odi-text-muted font-medium mb-1">Системный промпт</div>
                          <div className="text-xs text-odi-text whitespace-pre-line">{bot.systemPrompt}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 pt-0.5">
                    <Button icon="edit" minimal small title="Редактировать" onClick={() => navigate(`/master/bots/${bot.id}/edit`)} />
                    <Button
                      icon="duplicate"
                      minimal
                      small
                      title="Дублировать"
                      loading={duplicating === bot.id}
                      onClick={() => handleDuplicate(bot)}
                    />
                    <Popover
                      placement="bottom-end"
                      content={
                        <div className="p-3">
                          <p className="text-sm text-odi-text mb-2">Удалить <strong>{bot.name}</strong>?</p>
                          <div className="flex gap-2 justify-end">
                            <Button small minimal text="Отмена" className="bp5-popover-dismiss" />
                            <Button
                              small
                              intent="danger"
                              text="Удалить"
                              loading={deleting === bot.id}
                              onClick={() => handleDelete(bot.id)}
                            />
                          </div>
                        </div>
                      }
                    >
                      <Button icon="trash" minimal small intent="danger" title="Удалить" />
                    </Popover>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
