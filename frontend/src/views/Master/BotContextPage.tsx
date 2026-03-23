import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Card,
  FormGroup,
  TextArea,
  InputGroup,
  Switch,
  Tag,
  Spinner,
  NonIdealState,
  Tabs,
  Tab,
  Collapse,
  Icon,
} from '@blueprintjs/core'
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
    <Card className="!bg-odi-surface !border-odi-border !shadow-none">
      <h3 className="text-sm font-bold text-odi-text mb-3">Общий контекст этапа</h3>

      <FormGroup label="Цель этапа" className="!mb-3">
        <TextArea
          value={context.purpose ?? ''}
          onChange={(e) => {
            onChange({ ...context, purpose: e.target.value })
            autoResize(e.target)
          }}
          placeholder="Что должна понять/сделать группа на этом этапе..."
          fill
          rows={2}
          className="!bg-odi-bg !text-odi-text !resize-none"
        />
      </FormGroup>

      <FormGroup label="Методологическая задача" className="!mb-3">
        <TextArea
          value={context.methodologicalTask ?? ''}
          onChange={(e) => {
            onChange({ ...context, methodologicalTask: e.target.value })
            autoResize(e.target)
          }}
          placeholder="Какую методологическую задачу решает этот этап..."
          fill
          rows={2}
          className="!bg-odi-bg !text-odi-text !resize-none"
        />
      </FormGroup>

      <FormGroup label="Ключевые концепции" className="!mb-0">
        <div className="flex flex-wrap gap-1 mb-2">
          {(context.keyConcepts ?? []).map((c, i) => (
            <Tag key={i} minimal onRemove={() => removeConcept(i)}>
              {c}
            </Tag>
          ))}
        </div>
        <div className="flex gap-2">
          <InputGroup
            value={conceptInput}
            onChange={(e) => setConceptInput(e.target.value)}
            placeholder="Добавить концепцию..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcept())}
            className="flex-1"
          />
          <Button icon="plus" minimal onClick={addConcept} />
        </div>
      </FormGroup>
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
    <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-0">
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon
          icon="chevron-right"
          className={`text-odi-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-lg">&#x1F916;</span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-odi-text text-sm">{bot.name}</span>
          <Tag minimal className="ml-2 text-[10px]">{bot.specialistId}</Tag>
        </div>
        <Switch
          checked={context.active !== false}
          onChange={(e) => {
            e.stopPropagation()
            onChange({ ...context, active: !context.active || context.active === undefined ? false : true })
          }}
          className="!mb-0"
          innerLabelChecked="ON"
          innerLabel="OFF"
        />
      </div>

      <Collapse isOpen={expanded}>
        <div className="px-4 pb-4 space-y-3 border-t border-odi-border pt-3">
          <FormGroup label="Роль на этом этапе" className="!mb-0">
            <TextArea
              value={context.roleDescription ?? ''}
              onChange={(e) => {
                onChange({ ...context, roleDescription: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Кто этот бот в контексте этого этапа..."
              fill
              rows={2}
              className="!bg-odi-bg !text-odi-text !resize-none"
            />
          </FormGroup>

          <FormGroup label="Методологическая задача" className="!mb-0">
            <TextArea
              value={context.methodologicalTask ?? ''}
              onChange={(e) => {
                onChange({ ...context, methodologicalTask: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Что должен делать бот, какую задачу решать..."
              fill
              rows={2}
              className="!bg-odi-bg !text-odi-text !resize-none"
            />
          </FormGroup>

          <FormGroup label="Тон общения" className="!mb-0">
            <InputGroup
              value={context.tone ?? ''}
              onChange={(e) => onChange({ ...context, tone: e.target.value })}
              placeholder="Например: спокойно-сомневающийся, без агрессии"
            />
          </FormGroup>

          <FormGroup label="Триггеры (что отслеживать)" className="!mb-0">
            <div className="flex flex-wrap gap-1 mb-2">
              {(context.triggers ?? []).map((t, i) => (
                <Tag key={i} intent="primary" minimal onRemove={() => removeTrigger(i)}>
                  {t}
                </Tag>
              ))}
            </div>
            <div className="flex gap-2">
              <InputGroup
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                placeholder="Добавить триггер..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTrigger())}
                className="flex-1"
              />
              <Button icon="plus" minimal onClick={addTrigger} />
            </div>
          </FormGroup>

          <FormGroup label="Запрещено" className="!mb-0">
            <div className="flex flex-wrap gap-1 mb-2">
              {(context.forbidden ?? []).map((f, i) => (
                <Tag key={i} intent="danger" minimal onRemove={() => removeForbidden(i)}>
                  {f}
                </Tag>
              ))}
            </div>
            <div className="flex gap-2">
              <InputGroup
                value={forbiddenInput}
                onChange={(e) => setForbiddenInput(e.target.value)}
                placeholder="Добавить запрет..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForbidden())}
                className="flex-1"
              />
              <Button icon="plus" minimal onClick={addForbidden} />
            </div>
          </FormGroup>

          <FormGroup label="Поведение по умолчанию" className="!mb-0">
            <TextArea
              value={context.fallbackBehavior ?? ''}
              onChange={(e) => {
                onChange({ ...context, fallbackBehavior: e.target.value })
                autoResize(e.target)
              }}
              placeholder="Что делать, если группа не реагирует..."
              fill
              rows={2}
              className="!bg-odi-bg !text-odi-text !resize-none"
            />
          </FormGroup>
        </div>
      </Collapse>
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
        <Spinner size={32} />
      </div>
    )
  }

  if (!scenario) {
    return (
      <NonIdealState
        icon="error"
        title="Ошибка"
        description={error || 'Сценарий не найден'}
        action={
          <Button
            text="Назад"
            icon="arrow-left"
            onClick={() => navigate('/master/scenarios')}
          />
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            icon="arrow-left"
            minimal
            small
            onClick={() => navigate(`/master/scenarios/${scenarioId}/edit`)}
            className="!text-odi-text-muted"
          />
          <div>
            <h2 className="text-xl font-bold text-odi-text m-0">
              Контексты ботов
            </h2>
            <span className="text-sm text-odi-text-muted">
              {scenario.icon} {scenario.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Tag intent="success" minimal>
              Сохранено
            </Tag>
          )}
          {isDirty && (
            <Tag intent="warning" minimal>
              Есть изменения
            </Tag>
          )}
          <Button
            intent="primary"
            icon="floppy-disk"
            text="Сохранить"
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-500 px-1">{error}</div>}

      {/* Stage tabs */}
      <Tabs
        selectedTabId={activeStage}
        onChange={(newTab) => setActiveStage(newTab as string)}
        className="[&_.bp5-tab-list]:!bg-odi-surface [&_.bp5-tab]:!text-odi-text-muted [&_.bp5-tab[aria-selected=true]]:!text-odi-accent"
      >
        {DEFAULT_STAGES.map((stage) => (
          <Tab
            key={stage}
            id={stage}
            title={
              <span className="flex items-center gap-1">
                {stage}
                {(dirtyShared.has(stage) ||
                  [...dirtyBot].some((k) => k.startsWith(`${stage}::`))) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-odi-accent inline-block" />
                )}
              </span>
            }
          />
        ))}
      </Tabs>

      {/* Stage content */}
      <div className="space-y-4">
        {/* Shared context */}
        <SharedContextEditor
          context={sharedContexts[activeStage] ?? {}}
          onChange={(ctx) => updateSharedContext(activeStage, ctx)}
        />

        {/* Bot cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-odi-text">
              Активные боты на этапе ({scenarioBots.length})
            </h3>
          </div>

          {scenarioBots.length === 0 && (
            <Card className="!bg-odi-surface !border-odi-border !shadow-none">
              <NonIdealState
                icon="warning-sign"
                title="Нет ботов"
                description="Добавьте ботов в сценарий (обязательных или рекомендованных) для настройки их контекста."
              />
            </Card>
          )}

          {scenarioBots.map((bot) => {
            const key = `${activeStage}::${bot.id}`
            return (
              <BotContextCard
                key={key}
                bot={bot}
                context={botContexts[key] ?? { active: true }}
                onChange={(ctx) => updateBotContext(activeStage, bot.id, ctx)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
