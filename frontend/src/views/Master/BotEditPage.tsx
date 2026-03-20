import {
  Button,
  Card,
  FormGroup,
  InputGroup,
  TextArea,
  Switch,
  NumericInput,
  Tag,
  Spinner,
  NonIdealState,
} from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchBots, updateBot, type CreateBotDto } from '@/api/bots'
import { BotTestChat } from './BotTestChat'

const MODEL_SUGGESTIONS = [
  'google/gemini-2.0-flash-001',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324',
]

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

export function BotEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [specialistId, setSpecialistId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [personality, setPersonality] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [model, setModel] = useState(MODEL_SUGGESTIONS[0])
  const [enabled, setEnabled] = useState(true)
  const [stars, setStars] = useState(3)
  const [tag, setTag] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [usageCount, setUsageCount] = useState(0)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    fetchBots()
      .then((list) => {
        if (cancelled) return
        const bot = list.find((b) => b.id === id)
        if (!bot) {
          setLoadError('Бот не найден')
          return
        }
        setSpecialistId(bot.specialistId)
        setName(bot.name)
        setDescription(bot.description)
        setPersonality(bot.personality)
        setSystemPrompt(bot.systemPrompt ?? '')
        setModel(bot.model)
        setEnabled(bot.enabled)
        setStars(bot.stars)
        setTag(bot.tag ?? '')
        setTemperature(bot.temperature ?? 0.7)
        setMaxTokens(bot.maxTokens ?? 4096)
        setUsageCount(bot.usageCount)
        setAvgRating(bot.avgRating)
      })
      .catch(() => { if (!cancelled) setLoadError('Не удалось загрузить бота') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const descRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) autoResize(node)
  }, [description]) // eslint-disable-line react-hooks/exhaustive-deps

  const personalityRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) autoResize(node)
  }, [personality]) // eslint-disable-line react-hooks/exhaustive-deps

  const promptRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) autoResize(node)
  }, [systemPrompt]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = name.trim() && description.trim() && personality.trim()

  const handleSubmit = async () => {
    if (!canSubmit || !id) return
    setSaving(true)
    setError('')

    const dto: Partial<CreateBotDto> = {
      name: name.trim(),
      description: description.trim(),
      personality: personality.trim(),
      systemPrompt: systemPrompt.trim(),
      model,
      enabled,
      stars,
      tag: tag.trim() || null,
      temperature,
      maxTokens,
    }

    try {
      await updateBot(id, dto)
      navigate('/master/bots')
    } catch (e: any) {
      setError(e.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
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
        action={<Button text="Назад" icon="arrow-left" onClick={() => navigate('/master/bots')} />}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon="arrow-left" minimal small onClick={() => navigate('/master/bots')} className="!text-odi-text-muted" />
          <span className="text-2xl">{'\u{1F916}'}</span>
          <h2 className="text-xl font-bold text-odi-text m-0">{name || 'Редактировать бота'}</h2>
          <Tag minimal className="text-[10px]">{specialistId}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={enabled}
            label={enabled ? 'Включён' : 'Выключен'}
            onChange={() => setEnabled(!enabled)}
            className="!mb-0"
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
          {/* Identity card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Идентичность</h3>

            <FormGroup label="Имя" labelInfo="(обязательно)" className="!mb-3">
              <InputGroup
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Модератор"
                large
              />
            </FormGroup>

            <FormGroup label="Описание" labelInfo="(обязательно)" className="!mb-3">
              <TextArea
                value={description}
                inputRef={descRef}
                onChange={(e) => { setDescription(e.target.value); autoResize(e.target) }}
                placeholder="Что делает этот бот..."
                fill
                rows={2}
                className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
              />
            </FormGroup>

            <FormGroup label="Личность" labelInfo="(обязательно)" className="!mb-0">
              <TextArea
                value={personality}
                inputRef={personalityRef}
                onChange={(e) => { setPersonality(e.target.value); autoResize(e.target) }}
                placeholder="Характер и стиль общения..."
                fill
                rows={2}
                className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
              />
            </FormGroup>
          </Card>

          {/* System prompt card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Системный промпт</h3>
            <FormGroup className="!mb-0">
              <TextArea
                value={systemPrompt}
                inputRef={promptRef}
                onChange={(e) => { setSystemPrompt(e.target.value); autoResize(e.target) }}
                placeholder="Инструкции для LLM..."
                fill
                rows={6}
                className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none !font-mono !text-sm"
              />
            </FormGroup>
          </Card>

          {/* Test chat */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-0 overflow-hidden" style={{ height: 480 }}>
            <BotTestChat
              botId={id!}
              botName={name || 'Бот'}
              systemPrompt={systemPrompt}
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
            />
          </Card>
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-4">
          {/* Model settings */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Модель</h3>

            <FormGroup label="LLM" labelInfo="(OpenRouter)" className="!mb-3">
              <InputGroup
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="provider/model-name"
                fill
                list="model-suggestions"
              />
              <datalist id="model-suggestions">
                {MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
              </datalist>
            </FormGroup>

            <FormGroup label="Temperature" className="!mb-3">
              <NumericInput
                value={temperature}
                onValueChange={(v) => setTemperature(v)}
                min={0}
                max={2}
                stepSize={0.1}
                minorStepSize={0.01}
                fill
              />
            </FormGroup>

            <FormGroup label="Max Tokens" className="!mb-0">
              <NumericInput
                value={maxTokens}
                onValueChange={(v) => setMaxTokens(v)}
                min={256}
                max={100000}
                stepSize={256}
                fill
              />
            </FormGroup>
          </Card>

          {/* Meta card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Параметры</h3>

            <FormGroup label="Тег" className="!mb-3">
              <InputGroup
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Необязательно"
              />
            </FormGroup>

            <FormGroup label="Звёзды" className="!mb-0">
              <NumericInput
                value={stars}
                onValueChange={(v) => setStars(v)}
                min={1}
                max={5}
                fill
              />
            </FormGroup>
          </Card>

          {/* Info card */}
          <Card className="!bg-odi-surface !border-odi-border !shadow-none">
            <h3 className="text-sm font-bold text-odi-text mb-3">Статистика</h3>
            <div className="space-y-2 text-xs text-odi-text-muted">
              <div className="flex justify-between">
                <span>Specialist ID</span>
                <span className="font-mono text-odi-text">{specialistId}</span>
              </div>
              <div className="flex justify-between">
                <span>Использований</span>
                <span className="text-odi-text">{usageCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Рейтинг</span>
                <span className="text-odi-text">{'\u2605'} {avgRating}</span>
              </div>
              <div className="flex justify-between">
                <span>Статус</span>
                {enabled
                  ? <Tag intent="success" minimal round className="text-[10px]">Включён</Tag>
                  : <Tag intent="warning" minimal round className="text-[10px]">Выключен</Tag>
                }
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
