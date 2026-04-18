import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Plus,
  Search,
  Shield,
  Sun,
  Eye,
  Lock,
  Star,
  Pencil,
  Copy,
  Trash2,
  AlertCircle,
  Box,
  MessageSquare,
  Thermometer,
  Maximize,
  Layers,
} from 'lucide-react'
import { fetchBots, createBot, deleteBot, updateBot, type BotResponse } from '@/api/bots'
import { success, error as toastError } from '@/utils/toaster'

const ROLE_META: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  moderator:   { icon: Shield,  color: 'bg-blue-600',   label: 'Модератор' },
  analyst:     { icon: Eye,     color: 'bg-cyan-600',   label: 'Аналитик' },
  visionary:   { icon: Sun,     color: 'bg-purple-600', label: 'Визионер' },
  critic:      { icon: Eye,     color: 'bg-red-600',    label: 'Критик' },
  expert:      { icon: Star,    color: 'bg-amber-600',  label: 'Эксперт' },
  peacemaker:  { icon: Shield,  color: 'bg-green-600',  label: 'Миротворец' },
  provocateur: { icon: Star,    color: 'bg-orange-600', label: 'Провокатор' },
  keeper:      { icon: Lock,    color: 'bg-gray-600',   label: 'Хранитель' },
}

function getRoleMeta(specialistId: string) {
  return ROLE_META[specialistId] ?? { icon: Box, color: 'bg-primary', label: specialistId }
}

function renderStars(count: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-2.5 w-2.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
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
  const [bulkProvider, setBulkProvider] = useState('')
  const [bulkModel, setBulkModel] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)

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
        b.id.toLowerCase().includes(q) ||
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
      success('Бот удалён')
    } catch {
      toastError('Не удалось удалить бота')
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
        provider: bot.provider,
      })
      setBots((prev) => [copy, ...prev])
      success('Бот дублирован')
    } catch {
      toastError('Не удалось дублировать бота')
    } finally {
      setDuplicating(null)
    }
  }

  const handleToggle = async (bot: BotResponse) => {
    setToggling(bot.id)
    try {
      const updated = await updateBot(bot.id, { enabled: !bot.enabled })
      setBots((prev) => prev.map((b) => b.id === bot.id ? { ...b, enabled: updated.enabled } : b))
      success(updated.enabled ? 'Бот включён' : 'Бот выключен')
    } catch {
      toastError('Не удалось изменить статус')
    } finally {
      setToggling(null)
    }
  }

  const handleBulkApply = async () => {
    if (!bulkProvider && !bulkModel.trim()) return
    setBulkApplying(true)
    const patch: Record<string, any> = {}
    if (bulkProvider) patch.provider = bulkProvider
    if (bulkModel.trim()) patch.model = bulkModel.trim()
    try {
      const results = await Promise.allSettled(bots.map((b) => updateBot(b.id, patch)))
      const updated = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.length - updated
      setBots((prev) => prev.map((b, i) => {
        const r = results[i]
        return r.status === 'fulfilled' ? { ...b, ...patch } : b
      }))
      success(`Обновлено ${updated} из ${bots.length} ботов${failed ? ` (${failed} ошибок)` : ''}`)
    } catch {
      toastError('Ошибка при массовом обновлении')
    } finally {
      setBulkApplying(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground m-0">AI-боты</h2>
          <p className="text-xs text-muted-foreground mt-1">Управление ботами-специалистами для игровых сессий</p>
        </div>
        <Button className="bg-success hover:bg-success/90" onClick={() => navigate('/master/bots/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Создать бота
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по id, имени, роли, модели..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'enabled', 'disabled'] as FilterTab[]).map((tab) => {
            const labels: Record<FilterTab, string> = { all: 'Все', enabled: 'Активные', disabled: 'Выключенные' }
            const isActive = filter === tab
            return (
              <Button
                key={tab}
                size="sm"
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => setFilter(tab)}
              >
                {labels[tab]} ({counts[tab]})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Bulk update */}
      <Card className="bg-card border-border shadow-none p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Применить ко всем ботам ({bots.length})</Label>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Провайдер</Label>
            <select
              className="h-8 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]"
              value={bulkProvider}
              onChange={(e) => setBulkProvider(e.target.value)}
            >
              <option value="">— не менять —</option>
              <option value="openrouter">OpenRouter</option>
              <option value="mistral">Mistral AI</option>
              <option value="ollama">Ollama (локально)</option>
              <option value="local">LM Studio (локально)</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Модель</Label>
            <Input
              className="h-8 text-sm w-64"
              placeholder="Оставить пустым — не менять"
              value={bulkModel}
              onChange={(e) => setBulkModel(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                disabled={bulkApplying || (!bulkProvider && !bulkModel.trim())}
              >
                {bulkApplying ? <Spinner size={14} /> : <Layers className="h-3.5 w-3.5 mr-1.5" />}
                Применить
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <p className="text-sm text-foreground mb-1">Обновить всех <strong>{bots.length}</strong> ботов?</p>
              <p className="text-xs text-muted-foreground mb-3">
                {[bulkProvider && `провайдер → ${bulkProvider}`, bulkModel.trim() && `модель → ${bulkModel.trim()}`].filter(Boolean).join(', ')}
              </p>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost">Отмена</Button>
                <Button size="sm" disabled={bulkApplying} onClick={handleBulkApply}>
                  {bulkApplying ? <Spinner size={14} /> : 'Применить'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Ошибка</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" onClick={loadBots}>Повторить</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Box className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {search || filter !== 'all' ? 'Ничего не найдено' : 'Нет ботов'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {search || filter !== 'all' ? 'Попробуйте изменить фильтры' : 'Создайте первого бота'}
          </p>
        </div>
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

/* -- Bot Card -- */

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
  const RoleIcon = meta.icon

  return (
    <Card
      className={`shadow-none border-border p-0 overflow-hidden transition-opacity ${
        bot.enabled ? 'bg-card' : 'bg-card opacity-60'
      }`}
    >
      {/* Top color bar */}
      <div className={`h-1 ${meta.color}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`shrink-0 w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center`}>
            <RoleIcon className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground truncate">{bot.name}</span>
              {!bot.enabled && <Badge variant="warning" className="text-[10px] shrink-0">OFF</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
              {bot.tag && <Badge variant="default" className="text-[10px]">{bot.tag}</Badge>}
            </div>
          </div>
          <Switch
            checked={bot.enabled}
            disabled={toggling}
            onCheckedChange={onToggle}
            className="shrink-0"
          />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{bot.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-0.5">{renderStars(bot.stars)}</span>
          <span className="font-mono text-[10px] truncate max-w-[140px]" title={bot.model}>{bot.model}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-2.5 w-2.5" />
            {bot.usageCount}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5" />
            {Number(bot.avgRating).toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Thermometer className="h-2.5 w-2.5" />
            {bot.temperature}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-2.5 w-2.5" />
            {bot.maxTokens}
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Редактировать
        </Button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            title="Дублировать"
            disabled={duplicating}
            onClick={onDuplicate}
          >
            {duplicating ? <Spinner size={14} /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <p className="text-sm text-foreground mb-2">Удалить <strong>{bot.name}</strong>?</p>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost">Отмена</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting}
                  onClick={onDelete}
                >
                  {deleting ? <Spinner size={14} /> : 'Удалить'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  )
}
