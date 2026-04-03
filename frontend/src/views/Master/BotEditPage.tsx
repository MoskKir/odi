import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, Bot } from 'lucide-react'
import { fetchBots, updateBot, type CreateBotDto } from '@/api/bots'
import { success, error as toastError } from '@/utils/toaster'
import { BotTestChat } from './BotTestChat'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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
      success('Бот сохранён')
      navigate('/master/bots')
    } catch (e: any) {
      const msg = e.message || 'Ошибка при сохранении'
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
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
        <Button onClick={() => navigate('/master/bots')}>
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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate('/master/bots')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Bot className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground m-0">{name || 'Редактировать бота'}</h2>
          <Badge variant="outline" className="text-[10px]">{specialistId}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label className="mb-0">{enabled ? 'Включён' : 'Выключен'}</Label>
          </div>
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
          {/* Identity card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Идентичность</h3>

            <div className="space-y-2 mb-3">
              <Label>Имя <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Модератор"
                className="text-base"
              />
            </div>

            <div className="space-y-2 mb-3">
              <Label>Описание <span className="text-muted-foreground">(обязательно)</span></Label>
              <Textarea
                value={description}
                ref={descRef}
                onChange={(e) => { setDescription(e.target.value); autoResize(e.target) }}
                placeholder="Что делает этот бот..."
                rows={2}
                className="bg-background text-foreground overflow-hidden resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Личность <span className="text-muted-foreground">(обязательно)</span></Label>
              <Textarea
                value={personality}
                ref={personalityRef}
                onChange={(e) => { setPersonality(e.target.value); autoResize(e.target) }}
                placeholder="Характер и стиль общения..."
                rows={2}
                className="bg-background text-foreground overflow-hidden resize-none"
              />
            </div>
          </Card>

          {/* System prompt card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Системный промпт</h3>
            <Textarea
              value={systemPrompt}
              ref={promptRef}
              onChange={(e) => { setSystemPrompt(e.target.value); autoResize(e.target) }}
              placeholder="Инструкции для LLM..."
              rows={6}
              className="bg-background text-foreground overflow-hidden resize-none font-mono text-sm"
            />
          </Card>

          {/* Test chat */}
          <Card className="bg-card border-border shadow-none p-0 overflow-hidden" style={{ height: 480 }}>
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

        {/* Sidebar -- right col */}
        <div className="space-y-4">
          {/* Model settings */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Модель</h3>

            <div className="space-y-2 mb-3">
              <Label>LLM <span className="text-muted-foreground">(OpenRouter)</span></Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="provider/model-name"
                list="model-suggestions"
              />
              <datalist id="model-suggestions">
                {MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>

            <div className="space-y-2 mb-3">
              <Label>Temperature</Label>
              <Input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min={256}
                max={100000}
                step={256}
              />
            </div>
          </Card>

          {/* Meta card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Параметры</h3>

            <div className="space-y-2 mb-3">
              <Label>Тег</Label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Необязательно"
              />
            </div>

            <div className="space-y-2">
              <Label>Звёзды</Label>
              <Input
                type="number"
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
                min={1}
                max={5}
              />
            </div>
          </Card>

          {/* Info card */}
          <Card className="bg-card border-border shadow-none p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Статистика</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Specialist ID</span>
                <span className="font-mono text-foreground">{specialistId}</span>
              </div>
              <div className="flex justify-between">
                <span>Использований</span>
                <span className="text-foreground">{usageCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Рейтинг</span>
                <span className="text-foreground">{'\u2605'} {avgRating}</span>
              </div>
              <div className="flex justify-between">
                <span>Статус</span>
                {enabled
                  ? <Badge variant="success" className="text-[10px]">Включён</Badge>
                  : <Badge variant="warning" className="text-[10px]">Выключен</Badge>
                }
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
