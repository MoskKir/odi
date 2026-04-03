import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ChevronRight, Settings, Bot } from 'lucide-react'
import {
  fetchScenarios,
  updateScenario,
  type CreateScenarioDto,
} from '@/api/scenarios'
import { success, error as toastError } from '@/utils/toaster'
import { fetchBots, type BotResponse } from '@/api/bots'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'

const ICONS = [
  { value: '\u{1F3E2}', label: '\u{1F3E2} Бизнес' },
  { value: '\u{1F4A1}', label: '\u{1F4A1} Идея' },
  { value: '\u{1F91D}', label: '\u{1F91D} Команда' },
  { value: '\u{1F3AF}', label: '\u{1F3AF} Цель' },
  { value: '\u{1F52C}', label: '\u{1F52C} Исследование' },
  { value: '\u{1F680}', label: '\u{1F680} Запуск' },
  { value: '\u{1F3AD}', label: '\u{1F3AD} Театр' },
  { value: '\u{1F4CA}', label: '\u{1F4CA} Аналитика' },
]

const DIFF_OPTIONS = [
  { value: 'easy', label: 'Лёгкий', variant: 'success' as const },
  { value: 'medium', label: 'Средний', variant: 'warning' as const },
  { value: 'hard', label: 'Сложный', variant: 'danger' as const },
]

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export function ScenarioEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [icon, setIcon] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [published, setPublished] = useState(false)
  const [requiredBots, setRequiredBots] = useState<string[]>([])
  const [recommendedBots, setRecommendedBots] = useState<string[]>([])
  const [avgDurationMinutes, setAvgDurationMinutes] = useState('')
  const [sessionsCount, setSessionsCount] = useState(0)

  // Bots from DB
  const [allBots, setAllBots] = useState<BotResponse[]>([])
  const [botsExpanded, setBotsExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    Promise.all([fetchScenarios(), fetchBots()])
      .then(([scenarios, bots]) => {
        if (cancelled) return
        setAllBots(bots)
        const scenario = scenarios.find((s) => s.id === id)
        if (!scenario) {
          setLoadError('Сценарий не найден')
          return
        }
        setIcon(scenario.icon)
        setTitle(scenario.title)
        setSlug(scenario.slug)
        setSubtitle(scenario.subtitle)
        setDescription(scenario.description)
        setDifficulty(scenario.difficulty as any)
        setPublished(scenario.published)
        setRequiredBots(scenario.requiredBots ?? [])
        setRecommendedBots(scenario.recommendedBots ?? [])
        setSessionsCount(scenario.sessionsCount)
        setAvgDurationMinutes(
          scenario.avgDurationMinutes != null ? String(scenario.avgDurationMinutes) : '',
        )
      })
      .catch(() => { if (!cancelled) setLoadError('Не удалось загрузить данные') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const titleRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) autoResize(node)
  }, [title]) // eslint-disable-line react-hooks/exhaustive-deps

  const descRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) autoResize(node)
  }, [description]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = title.trim() && subtitle.trim() && description.trim()

  const handleSubmit = async () => {
    if (!canSubmit || !id) return
    setSaving(true)
    setError('')

    const dto: Partial<CreateScenarioDto> = {
      icon,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      difficulty,
      published,
      requiredBots,
      recommendedBots,
      avgDurationMinutes: avgDurationMinutes ? Number(avgDurationMinutes) : null,
    }

    try {
      await updateScenario(id, dto)
      success('Сценарий сохранён')
      navigate('/master/scenarios')
    } catch (e: any) {
      const msg = e.message || 'Ошибка при сохранении'
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleBot = (specialistId: string, list: 'required' | 'recommended') => {
    const setter = list === 'required' ? setRequiredBots : setRecommendedBots
    setter((prev) =>
      prev.includes(specialistId)
        ? prev.filter((b) => b !== specialistId)
        : [...prev, specialistId]
    )
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Ошибка</h3>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button onClick={() => navigate('/master/scenarios')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
      </div>
    )
  }

  const diffCfg = DIFF_OPTIONS.find((d) => d.value === difficulty)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate('/master/scenarios')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold text-foreground m-0">Редактировать сценарий</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label className="mb-0">{published ? 'Опубликован' : 'Черновик'}</Label>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/master/scenarios/${id}/bot-context`)}
            className="text-primary"
          >
            <Settings className="h-4 w-4 mr-1" />
            Контексты ботов
          </Button>
          <Button
            disabled={!canSubmit || saving}
            onClick={handleSubmit}
          >
            {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4 mr-1" />}
            Сохранить
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 px-1">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main content -- left 3 cols */}
        <div className="xl:col-span-3 space-y-4">
          {/* Title card */}
          <Card className="bg-card border-border shadow-none p-5">
            <div className="space-y-2 mb-3">
              <Label>Название <span className="text-muted-foreground">(обязательно)</span></Label>
              <Textarea
                value={title}
                ref={titleRef}
                onChange={(e) => { setTitle(e.target.value); autoResize(e.target) }}
                placeholder="Название сценария"
                rows={1}
                className="bg-background text-foreground overflow-hidden resize-none text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Подзаголовок <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Короткое описание в одну строку"
              />
            </div>
          </Card>

          {/* Description card */}
          <Card className="bg-card border-border shadow-none p-5">
            <div className="space-y-2">
              <Label>Описание <span className="text-muted-foreground">(обязательно)</span></Label>
              <Textarea
                value={description}
                ref={descRef}
                onChange={(e) => { setDescription(e.target.value); autoResize(e.target) }}
                placeholder="Подробное описание сценария..."
                rows={3}
                className="bg-background text-foreground overflow-hidden resize-none"
              />
            </div>
          </Card>

          {/* Bots card */}
          <Card className="bg-card border-border shadow-none p-0">
            <div className="px-5 py-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Боты</h3>
              <div className="flex flex-wrap gap-2 mb-1">
                {requiredBots.length === 0 && recommendedBots.length === 0 && (
                  <span className="text-xs text-muted-foreground">Боты не выбраны</span>
                )}
                {requiredBots.map((b) => (
                  <Badge key={`r-${b}`} variant="default" className="gap-1">
                    {allBots.find((bot) => bot.specialistId === b)?.name ?? b} (обяз.)
                    <button onClick={() => toggleBot(b, 'required')} className="ml-1 hover:text-red-500">
                      <span className="text-xs">&times;</span>
                    </button>
                  </Badge>
                ))}
                {recommendedBots.map((b) => (
                  <Badge key={`rec-${b}`} variant="outline" className="gap-1">
                    {allBots.find((bot) => bot.specialistId === b)?.name ?? b} (рек.)
                    <button onClick={() => toggleBot(b, 'recommended')} className="ml-1 hover:text-red-500">
                      <span className="text-xs">&times;</span>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Accordion: select from existing bots */}
            <div
              className="border-t border-border px-5 py-2 flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setBotsExpanded(!botsExpanded)}
            >
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${botsExpanded ? 'rotate-90' : ''}`}
              />
              <span className="text-sm text-muted-foreground">Выбрать из существующих ботов ({allBots.length})</span>
            </div>

            {botsExpanded && (
              <div className="border-t border-border">
                {allBots.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">Нет доступных ботов</div>
                ) : (
                  <div className="divide-y divide-border">
                    {allBots.map((bot) => {
                      const isRequired = requiredBots.includes(bot.specialistId)
                      const isRecommended = recommendedBots.includes(bot.specialistId)
                      return (
                        <div key={bot.id} className="px-5 py-3 flex items-center gap-4">
                          <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{bot.name}</span>
                              <Badge variant="outline" className="text-[10px]">{bot.specialistId}</Badge>
                              <Badge variant="outline" className="text-[10px]">{bot.model}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{bot.description}</div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={() => toggleBot(bot.specialistId, 'required')}
                                className="rounded border-border"
                              />
                              Обяз.
                            </label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isRecommended}
                                onChange={() => toggleBot(bot.specialistId, 'recommended')}
                                className="rounded border-border"
                              />
                              Рек.
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar -- right col */}
        <div className="space-y-4">
          {/* Meta card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Параметры</h3>

            <div className="space-y-2 mb-3">
              <Label>Иконка</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mb-3">
              <Label>Сложность</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFF_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ср. длительность (мин)</Label>
              <Input
                type="number"
                min={0}
                value={avgDurationMinutes}
                onChange={(e) => setAvgDurationMinutes(e.target.value)}
                placeholder="60"
              />
            </div>
          </Card>

          {/* Info card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Информация</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Slug</span>
                <span className="font-mono text-foreground">{slug}</span>
              </div>
              <div className="flex justify-between">
                <span>Сессий</span>
                <span className="text-foreground">{sessionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Статус</span>
                {published
                  ? <Badge variant="success" className="text-[10px]">Опубликован</Badge>
                  : <Badge variant="warning" className="text-[10px]">Черновик</Badge>
                }
              </div>
              {diffCfg && (
                <div className="flex justify-between">
                  <span>Сложность</span>
                  <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
