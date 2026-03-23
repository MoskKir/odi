import {
  Button,
  Card,
  Checkbox,
  FormGroup,
  Icon,
  InputGroup,
  TextArea,
  HTMLSelect,
  Switch,
  Tag,
  Spinner,
  NonIdealState,
} from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchScenarios,
  updateScenario,
  type CreateScenarioDto,
} from '@/api/scenarios'
import { success, error as toastError } from '@/utils/toaster'
import { fetchBots, type BotResponse } from '@/api/bots'

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
  { value: 'easy', label: 'Лёгкий', intent: 'success' as const },
  { value: 'medium', label: 'Средний', intent: 'warning' as const },
  { value: 'hard', label: 'Сложный', intent: 'danger' as const },
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
    return <div className="flex justify-center py-12"><Spinner size={32} /></div>
  }

  if (loadError) {
    return (
      <NonIdealState
        icon="error"
        title="Ошибка"
        description={loadError}
        action={<Button text="Назад" icon="arrow-left" onClick={() => navigate('/master/scenarios')} />}
      />
    )
  }

  const diffCfg = DIFF_OPTIONS.find((d) => d.value === difficulty)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon="arrow-left" minimal small onClick={() => navigate('/master/scenarios')} className="!text-odi-text-muted" />
          <h2 className="text-xl font-bold text-odi-text m-0">Редактировать сценарий</h2>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={published}
            label={published ? 'Опубликован' : 'Черновик'}
            onChange={() => setPublished(!published)}
            className="!mb-0"
          />
          <Button
            icon="settings"
            text="Контексты ботов"
            onClick={() => navigate(`/master/scenarios/${id}/bot-context`)}
            className="!text-odi-accent"
          />
          <Button
            intent="primary"
            icon="floppy-disk"
            text="Сохранить"
            loading={saving}
            disabled={!canSubmit}
            onClick={handleSubmit}
          />
        </div>
      </div>

      {error && <div className="text-sm text-red-500 px-1">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main content — left 3 cols */}
        <div className="xl:col-span-3 space-y-4">
          {/* Title card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <FormGroup label="Название" labelInfo="(обязательно)" className="!mb-3">
              <TextArea
                value={title}
                inputRef={titleRef}
                onChange={(e) => { setTitle(e.target.value); autoResize(e.target) }}
                placeholder="Название сценария"
                fill
                rows={1}
                className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none !text-lg !font-bold"
              />
            </FormGroup>

            <FormGroup label="Подзаголовок" labelInfo="(обязательно)" className="!mb-0">
              <InputGroup
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Короткое описание в одну строку"
              />
            </FormGroup>
          </Card>

          {/* Description card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <FormGroup label="Описание" labelInfo="(обязательно)" className="!mb-0">
              <TextArea
                value={description}
                inputRef={descRef}
                onChange={(e) => { setDescription(e.target.value); autoResize(e.target) }}
                placeholder="Подробное описание сценария..."
                fill
                rows={3}
                className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
              />
            </FormGroup>
          </Card>

          {/* Bots card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-0">
            <div className="px-5 py-4">
              <h3 className="text-sm font-bold text-odi-text mb-3">Боты</h3>
              <div className="flex flex-wrap gap-2 mb-1">
                {requiredBots.length === 0 && recommendedBots.length === 0 && (
                  <span className="text-xs text-odi-text-muted">Боты не выбраны</span>
                )}
                {requiredBots.map((b) => (
                  <Tag key={`r-${b}`} intent="primary" minimal onRemove={() => toggleBot(b, 'required')}>
                    {allBots.find((bot) => bot.specialistId === b)?.name ?? b} (обяз.)
                  </Tag>
                ))}
                {recommendedBots.map((b) => (
                  <Tag key={`rec-${b}`} minimal onRemove={() => toggleBot(b, 'recommended')}>
                    {allBots.find((bot) => bot.specialistId === b)?.name ?? b} (рек.)
                  </Tag>
                ))}
              </div>
            </div>

            {/* Accordion: select from existing bots */}
            <div
              className="border-t border-odi-border px-5 py-2 flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setBotsExpanded(!botsExpanded)}
            >
              <Icon
                icon="chevron-right"
                className={`text-odi-text-muted transition-transform ${botsExpanded ? 'rotate-90' : ''}`}
              />
              <span className="text-sm text-odi-text-muted">Выбрать из существующих ботов ({allBots.length})</span>
            </div>

            {botsExpanded && (
              <div className="border-t border-odi-border">
                {allBots.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-odi-text-muted">Нет доступных ботов</div>
                ) : (
                  <div className="divide-y divide-odi-border">
                    {allBots.map((bot) => {
                      const isRequired = requiredBots.includes(bot.specialistId)
                      const isRecommended = recommendedBots.includes(bot.specialistId)
                      return (
                        <div key={bot.id} className="px-5 py-3 flex items-center gap-4">
                          <span className="text-xl shrink-0">{'\u{1F916}'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-odi-text text-sm">{bot.name}</span>
                              <Tag minimal className="text-[10px]">{bot.specialistId}</Tag>
                              <Tag minimal className="text-[10px]">{bot.model}</Tag>
                            </div>
                            <div className="text-xs text-odi-text-muted mt-0.5">{bot.description}</div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <Checkbox
                              checked={isRequired}
                              label="Обяз."
                              onChange={() => toggleBot(bot.specialistId, 'required')}
                              className="!mb-0 !text-xs"
                            />
                            <Checkbox
                              checked={isRecommended}
                              label="Рек."
                              onChange={() => toggleBot(bot.specialistId, 'recommended')}
                              className="!mb-0 !text-xs"
                            />
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

        {/* Sidebar — right col */}
        <div className="space-y-4">
          {/* Meta card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Параметры</h3>

            <FormGroup label="Иконка" className="!mb-3">
              <HTMLSelect value={icon} onChange={(e) => setIcon(e.target.value)} fill>
                {ICONS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Сложность" className="!mb-3">
              <HTMLSelect value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} fill>
                {DIFF_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Ср. длительность (мин)" className="!mb-0">
              <InputGroup
                type="number"
                min={0}
                value={avgDurationMinutes}
                onChange={(e) => setAvgDurationMinutes(e.target.value)}
                placeholder="60"
              />
            </FormGroup>
          </Card>

          {/* Info card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Информация</h3>
            <div className="space-y-2 text-xs text-odi-text-muted">
              <div className="flex justify-between">
                <span>Slug</span>
                <span className="font-mono text-odi-text">{slug}</span>
              </div>
              <div className="flex justify-between">
                <span>Сессий</span>
                <span className="text-odi-text">{sessionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Статус</span>
                {published
                  ? <Tag intent="success" minimal round className="text-[10px]">Опубликован</Tag>
                  : <Tag intent="warning" minimal round className="text-[10px]">Черновик</Tag>
                }
              </div>
              {diffCfg && (
                <div className="flex justify-between">
                  <span>Сложность</span>
                  <Tag intent={diffCfg.intent} minimal round className="text-[10px]">{diffCfg.label}</Tag>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
