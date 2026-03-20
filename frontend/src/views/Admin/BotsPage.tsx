import { Card, Tag, Button, Icon, Spinner, NonIdealState, Popover, Switch, InputGroup } from '@blueprintjs/core'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBots, createBot, deleteBot, updateBot, type BotResponse } from '@/api/bots'

const ROLE_META: Record<string, { icon: string; color: string; label: string }> = {
  moderator:   { icon: 'shield',       color: 'bg-blue-600',   label: 'Модератор' },
  analyst:     { icon: 'chart',        color: 'bg-cyan-600',   label: 'Аналитик' },
  visionary:   { icon: 'lightbulb',    color: 'bg-purple-600', label: 'Визионер' },
  critic:      { icon: 'eye-open',     color: 'bg-red-600',    label: 'Критик' },
  expert:      { icon: 'learning',     color: 'bg-amber-600',  label: 'Эксперт' },
  peacemaker:  { icon: 'heart',        color: 'bg-green-600',  label: 'Миротворец' },
  provocateur: { icon: 'flash',        color: 'bg-orange-600', label: 'Провокатор' },
  keeper:      { icon: 'lock',         color: 'bg-gray-600',   label: 'Хранитель' },
}

function getRoleMeta(specialistId: string) {
  return ROLE_META[specialistId] ?? { icon: 'cube', color: 'bg-odi-accent', label: specialistId }
}

function renderStars(count: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Icon key={i} icon="star" size={10} className={i < count ? 'text-amber-400' : 'text-odi-border'} />
  ))
}

type FilterTab = 'all' | 'enabled' | 'disabled'

export function BotsPage() {
  const navigate = useNavigate()
  const [bots, setBots] = useState<BotResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')

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

  const filtered = useMemo(() => {
    let list = bots
    if (filter === 'enabled') list = list.filter((b) => b.enabled)
    if (filter === 'disabled') list = list.filter((b) => !b.enabled)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.specialistId.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        (b.tag && b.tag.toLowerCase().includes(q))
      )
    }
    return list
  }, [bots, filter, search])

  const counts = useMemo(() => ({
    all: bots.length,
    enabled: bots.filter((b) => b.enabled).length,
    disabled: bots.filter((b) => !b.enabled).length,
  }), [bots])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteBot(id)
      setBots((prev) => prev.filter((b) => b.id !== id))
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

  const handleToggle = async (bot: BotResponse) => {
    setToggling(bot.id)
    try {
      const updated = await updateBot(bot.id, { enabled: !bot.enabled })
      setBots((prev) => prev.map((b) => b.id === bot.id ? { ...b, enabled: updated.enabled } : b))
    } catch {
      setError('Не удалось изменить статус')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-odi-text m-0">AI-боты</h2>
          <p className="text-xs text-odi-text-muted mt-1">Управление ботами-специалистами для игровых сессий</p>
        </div>
        <Button icon="plus" intent="success" text="Создать бота" onClick={() => navigate('/master/bots/new')} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <InputGroup
          leftIcon="search"
          placeholder="Поиск по имени, роли, модели..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!w-64"
          small
        />
        <div className="flex gap-1">
          {(['all', 'enabled', 'disabled'] as FilterTab[]).map((tab) => {
            const labels: Record<FilterTab, string> = { all: 'Все', enabled: 'Активные', disabled: 'Выключенные' }
            const isActive = filter === tab
            return (
              <Button
                key={tab}
                small
                minimal={!isActive}
                intent={isActive ? 'primary' : 'none'}
                text={`${labels[tab]} (${counts[tab]})`}
                onClick={() => setFilter(tab)}
              />
            )
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={loadBots} />}
        />
      ) : filtered.length === 0 ? (
        <NonIdealState
          icon="cube"
          title={search || filter !== 'all' ? 'Ничего не найдено' : 'Нет ботов'}
          description={search || filter !== 'all' ? 'Попробуйте изменить фильтры' : 'Создайте первого бота'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              toggling={toggling === bot.id}
              deleting={deleting === bot.id}
              duplicating={duplicating === bot.id}
              onEdit={() => navigate(`/master/bots/${bot.id}/edit`)}
              onToggle={() => handleToggle(bot)}
              onDuplicate={() => handleDuplicate(bot)}
              onDelete={() => handleDelete(bot.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Bot Card ── */

function BotCard({ bot, toggling, deleting, duplicating, onEdit, onToggle, onDuplicate, onDelete }: {
  bot: BotResponse
  toggling: boolean
  deleting: boolean
  duplicating: boolean
  onEdit: () => void
  onToggle: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const meta = getRoleMeta(bot.specialistId)

  return (
    <Card
      className={`!shadow-none !border-odi-border !p-0 overflow-hidden transition-opacity ${
        bot.enabled ? '!bg-odi-surface' : '!bg-odi-surface opacity-60'
      }`}
    >
      {/* Top color bar */}
      <div className={`h-1 ${meta.color}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`shrink-0 w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center`}>
            <Icon icon={meta.icon as any} size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-odi-text truncate">{bot.name}</span>
              {!bot.enabled && <Tag minimal intent="warning" className="text-[10px] shrink-0">OFF</Tag>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Tag minimal className="text-[10px]">{meta.label}</Tag>
              {bot.tag && <Tag minimal intent="primary" className="text-[10px]">{bot.tag}</Tag>}
            </div>
          </div>
          <Switch
            checked={bot.enabled}
            disabled={toggling}
            onChange={onToggle}
            className="!mb-0 shrink-0"
          />
        </div>

        {/* Description */}
        <p className="text-sm text-odi-text-muted line-clamp-2 mb-3">{bot.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-odi-text-muted mb-3">
          <span className="flex items-center gap-0.5">{renderStars(bot.stars)}</span>
          <span className="font-mono text-[10px] truncate max-w-[140px]" title={bot.model}>{bot.model}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-odi-text-muted">
          <span className="flex items-center gap-1">
            <Icon icon="chat" size={10} />
            {bot.usageCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="star" size={10} />
            {Number(bot.avgRating).toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="temperature" size={10} />
            {bot.temperature}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="maximize" size={10} />
            {bot.maxTokens}
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-odi-border px-4 py-2">
        <Button
          icon="edit"
          minimal
          small
          text="Редактировать"
          className="!text-odi-text-muted"
          onClick={onEdit}
        />
        <div className="flex gap-1">
          <Button
            icon="duplicate"
            minimal
            small
            title="Дублировать"
            loading={duplicating}
            onClick={onDuplicate}
            className="!text-odi-text-muted"
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
                    loading={deleting}
                    onClick={onDelete}
                  />
                </div>
              </div>
            }
          >
            <Button icon="trash" minimal small intent="danger" title="Удалить" className="!text-red-400" />
          </Popover>
        </div>
      </div>
    </Card>
  )
}
