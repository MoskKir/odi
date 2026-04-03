import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ChevronRight, Plus, AlertCircle, AlertTriangle } from 'lucide-react'
import { fetchScenarios, type ScenarioResponse } from '@/api/scenarios'
import { fetchBots, type BotResponse } from '@/api/bots'
import {
  fetchBotContexts,
  upsertBotContext,
  upsertSharedContext,
  type BotStageContext,
  type StageSharedContext,
} from '@/api/bot-contexts'
import { success, error as toastError } from '@/utils/toaster'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { X } from 'lucide-react'

const DEFAULT_STAGES = [
  'Знакомство',
  'Анализ проблемы',
  'Генерация идей',
  'Обсуждение',
  'Подведение итогов',
]

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// ---------- Shared context editor for a single stage ----------

interface SharedContextEditorProps {
  context: Partial<StageSharedContext>
  onChange: (ctx: Partial<StageSharedContext>) => void
}

function SharedContextEditor({ context, onChange }: SharedContextEditorProps) {
  const [conceptInput, setConceptInput] = useState('')

  const addConcept = () => {
    const val = conceptInput.trim()
    if (!val) return
    onChange({ ...context, keyConcepts: [...(context.keyConcepts ?? []), val] })
    setConceptInput('')
  }

  const removeConcept = (idx: number) => {
    const next = [...(context.keyConcepts ?? [])]
    next.splice(idx, 1)
    onChange({ ...context, keyConcepts: next })
  }

  return (
    <Card className="bg-card border-border shadow-none p-5">
      <h3 className="text-sm font-bold text-foreground mb-3">Общий контекст этапа</h3>

      <div className="space-y-2 mb-3">
        <Label>Цель этапа</Label>
        <Textarea
          value={context.purpose ?? ''}
          onChange={(e) => {
            onChange({ ...context, purpose: e.target.value })
            autoResize(e.target)
          }}
          placeholder="Что должна понять/сделать группа на этом этапе..."
          rows={2}
          className="bg-background text-foreground resize-none"
        />
      </div>

      <div className="space-y-2 mb-3">
        <Label>Методологическая задача</Label>
        <Textarea
          value={context.methodologicalTask ?? ''}
          onChange={(e) => {
            onChange({ ...context, methodologicalTask: e.target.value })
            autoResize(e.target)
          }}
          placeholder="Какую методологическую задачу решает этот этап..."
          rows={2}
          className="bg-background text-foreground resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Ключевые концепции</Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {(context.keyConcepts ?? []).map((c, i) => (
            <Badge key={i} variant="outline" className="gap-1">
              {c}
              <button onClick={() => removeConcept(i)} className="ml-1 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Добавить концепцию..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcept())}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={addConcept}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ---------- Bot context card for a single bot on a single stage ----------

interface BotContextCardProps {
  bot: BotResponse
  context: Partial<BotStageContext>
  onChange: (ctx: Partial<BotStageContext>) => void
}

function BotContextCard({ bot, context, onChange }: BotContextCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [triggerInput, setTriggerInput] = useState('')
  const [forbiddenInput, setForbiddenInput] = useState('')

  const addTrigger = () => {
    const val = triggerInput.trim()
    if (!val) return
    onChange({ ...context, triggers: [...(context.triggers ?? []), val] })
    setTriggerInput('')
  }

  const removeTrigger = (idx: number) => {
    const next = [...(context.triggers ?? [])]
    next.splice(idx, 1)
    onChange({ ...context, triggers: next })
  }

  const addForbidden = () => {
    const val = forbiddenInput.trim()
    if (!val) return
    onChange({ ...context, forbidden: [...(context.forbidden ?? []), val] })
    setForbiddenInput('')
  }

  const removeForbidden = (idx: number) => {
    const next = [...(context.forbidden ?? [])]
    next.splice(idx, 1)
    onChange({ ...context, forbidden: next })
  }

  return (
    <Card className="bg-card border-border shadow-none p-0">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-lg">&#x1F916;</span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-foreground text-sm">{bot.name}</span>
          <Badge variant="outline" className="ml-2 text-[10px]">{bot.specialistId}</Badge>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={context.active !== false}
            onCheckedChange={(checked) => {
              onChange({ ...context, active: checked })
            }}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="space-y-2">
            <Label>Роль на этом этапе</Label>
            <Textarea
              value={context.roleDescription ?? ''}
              onChange={(e) => {
                onChange({ ...context, roleDescription: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Кто этот бот в контексте этого этапа..."
              rows={2}
              className="bg-background text-foreground resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Методологическая задача</Label>
            <Textarea
              value={context.methodologicalTask ?? ''}
              onChange={(e) => {
                onChange({ ...context, methodologicalTask: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Что должен делать бот, какую задачу решать..."
              rows={2}
              className="bg-background text-foreground resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Тон общения</Label>
            <Input
              value={context.tone ?? ''}
              onChange={(e) => onChange({ ...context, tone: e.target.value })}
              placeholder="Например: спокойно-сомневающийся, без агрессии"
            />
          </div>

          <div className="space-y-2">
            <Label>Триггеры (что отслеживать)</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(context.triggers ?? []).map((t, i) => (
                <Badge key={i} variant="default" className="gap-1">
                  {t}
                  <button onClick={() => removeTrigger(i)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                placeholder="Добавить триггер..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={addTrigger}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Запрещено</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(context.forbidden ?? []).map((f, i) => (
                <Badge key={i} variant="danger" className="gap-1">
                  {f}
                  <button onClick={() => removeForbidden(i)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={forbiddenInput}
                onChange={(e) => setForbiddenInput(e.target.value)}
                placeholder="Добавить запрет..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForbidden())}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={addForbidden}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Поведение по умолчанию</Label>
            <Textarea
              value={context.fallbackBehavior ?? ''}
              onChange={(e) => {
                onChange({ ...context, fallbackBehavior: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Что делать, если группа не реагирует..."
              rows={2}
              className="bg-background text-foreground resize-none"
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ---------- Main page ----------

export function BotContextPage() {
  const { id: scenarioId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [scenario, setScenario] = useState<ScenarioResponse | null>(null)
  const [allBots, setAllBots] = useState<BotResponse[]>([])
  const [activeStage, setActiveStage] = useState(DEFAULT_STAGES[0])

  // State: shared contexts indexed by stageName
  const [sharedContexts, setSharedContexts] = useState<Record<string, Partial<StageSharedContext>>>({})
  // State: bot contexts indexed by `${stageName}::${botConfigId}`
  const [botContexts, setBotContexts] = useState<Record<string, Partial<BotStageContext>>>({})

  // Track which items have been modified
  const [dirtyShared, setDirtyShared] = useState<Set<string>>(new Set())
  const [dirtyBot, setDirtyBot] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!scenarioId) return
    let cancelled = false
    setLoading(true)

    Promise.all([fetchScenarios(), fetchBots(), fetchBotContexts(scenarioId)])
      .then(([scenarios, bots, ctxData]) => {
        if (cancelled) return
        const sc = scenarios.find((s) => s.id === scenarioId)
        if (!sc) {
          setError('Сценарий не найден')
          return
        }
        setScenario(sc)
        setAllBots(bots)

        // Populate shared contexts
        const shared: Record<string, Partial<StageSharedContext>> = {}
        for (const ctx of ctxData.sharedContexts) {
          shared[ctx.stageName] = ctx
        }
        setSharedContexts(shared)

        // Populate bot contexts
        const botCtx: Record<string, Partial<BotStageContext>> = {}
        for (const ctx of ctxData.botContexts) {
          botCtx[`${ctx.stageName}::${ctx.botConfigId}`] = ctx
        }
        setBotContexts(botCtx)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить данные')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [scenarioId])

  // Get bots relevant to this scenario
  const scenarioBots = allBots.filter(
    (b) =>
      scenario?.requiredBots?.includes(b.specialistId) ||
      scenario?.recommendedBots?.includes(b.specialistId),
  )

  const updateSharedContext = useCallback(
    (stage: string, ctx: Partial<StageSharedContext>) => {
      setSharedContexts((prev) => ({ ...prev, [stage]: ctx }))
      setDirtyShared((prev) => new Set(prev).add(stage))
      setSaveSuccess(false)
    },
    [],
  )

  const updateBotContext = useCallback(
    (stage: string, botConfigId: string, ctx: Partial<BotStageContext>) => {
      const key = `${stage}::${botConfigId}`
      setBotContexts((prev) => ({ ...prev, [key]: ctx }))
      setDirtyBot((prev) => new Set(prev).add(key))
      setSaveSuccess(false)
    },
    [],
  )

  const handleSave = async () => {
    if (!scenarioId) return
    setSaving(true)
    setError('')
    setSaveSuccess(false)

    try {
      const promises: Promise<any>[] = []

      // Save dirty shared contexts
      for (const stage of dirtyShared) {
        const ctx = sharedContexts[stage]
        if (ctx) {
          promises.push(
            upsertSharedContext(scenarioId, {
              ...ctx,
              scenarioId,
              stageName: stage,
            }),
          )
        }
      }

      // Save dirty bot contexts
      for (const key of dirtyBot) {
        const ctx = botContexts[key]
        if (ctx) {
          const [stage, botConfigId] = key.split('::')
          promises.push(
            upsertBotContext(scenarioId, {
              ...ctx,
              scenarioId,
              stageName: stage,
              botConfigId,
            }),
          )
        }
      }

      await Promise.all(promises)
      setDirtyShared(new Set())
      setDirtyBot(new Set())
      setSaveSuccess(true)
      success('Контексты сохранены')
    } catch (e: any) {
      const msg = e.message || 'Ошибка при сохранении'
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = dirtyShared.size > 0 || dirtyBot.size > 0

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Ошибка</h3>
        <p className="text-sm text-muted-foreground">{error || 'Сценарий не найден'}</p>
        <Button onClick={() => navigate('/master/scenarios')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => navigate(`/master/scenarios/${scenarioId}/edit`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground m-0">
              Контексты ботов
            </h2>
            <span className="text-sm text-muted-foreground">
              {scenario.icon} {scenario.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge variant="success">
              Сохранено
            </Badge>
          )}
          {isDirty && (
            <Badge variant="warning">
              Есть изменения
            </Badge>
          )}
          <Button
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4 mr-1" />}
            Сохранить
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 px-1">{error}</div>}

      {/* Stage tabs */}
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <TabsList>
          {DEFAULT_STAGES.map((stage) => (
            <TabsTrigger key={stage} value={stage}>
              <span className="flex items-center gap-1">
                {stage}
                {(dirtyShared.has(stage) ||
                  [...dirtyBot].some((k) => k.startsWith(`${stage}::`))) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                )}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {DEFAULT_STAGES.map((stage) => (
          <TabsContent key={stage} value={stage}>
            {/* Stage content */}
            <div className="space-y-4">
              {/* Shared context */}
              <SharedContextEditor
                context={sharedContexts[stage] ?? {}}
                onChange={(ctx) => updateSharedContext(stage, ctx)}
              />

              {/* Bot cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    Активные боты на этапе ({scenarioBots.length})
                  </h3>
                </div>

                {scenarioBots.length === 0 && (
                  <Card className="bg-card border-border shadow-none p-5">
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                      <h3 className="text-base font-semibold text-foreground">Нет ботов</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Добавьте ботов в сценарий (обязательных или рекомендованных) для настройки их контекста.
                      </p>
                    </div>
                  </Card>
                )}

                {scenarioBots.map((bot) => {
                  const key = `${stage}::${bot.id}`
                  return (
                    <BotContextCard
                      key={key}
                      bot={bot}
                      context={botContexts[key] ?? { active: true }}
                      onChange={(ctx) => updateBotContext(stage, bot.id, ctx)}
                    />
                  )
                })}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
