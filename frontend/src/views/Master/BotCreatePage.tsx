import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import { createBot, type CreateBotDto, type BotProvider } from '@/api/bots'
import { fetchOllamaModels } from '@/api/llm'
import { success, error as toastError } from '@/utils/toaster'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'

const CLOUD_MODEL_SUGGESTIONS = [
  'google/gemini-2.0-flash-001',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324',
]

const MISTRAL_MODEL_SUGGESTIONS = [
  'mistral-large-latest',
  'mistral-small-latest',
  'mistral-medium-latest',
  'codestral-latest',
  'open-mistral-nemo',
]

export function BotCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [specialistId, setSpecialistId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [personality, setPersonality] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [model, setModel] = useState(CLOUD_MODEL_SUGGESTIONS[0])
  const [enabled, setEnabled] = useState(true)
  const [stars, setStars] = useState(3)
  const [tag, setTag] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [botProvider, setBotProvider] = useState<BotProvider | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])

  useEffect(() => {
    if (botProvider === 'ollama') {
      fetchOllamaModels().then((models) => {
        setOllamaModels(models)
        if (models.length > 0) setModel(models[0])
      }).catch(() => {})
    }
  }, [botProvider])

  const canSubmit = specialistId.trim() && name.trim() && description.trim() && personality.trim() && systemPrompt.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError('')

    const dto: CreateBotDto = {
      specialistId: specialistId.trim(),
      name: name.trim(),
      description: description.trim(),
      personality: personality.trim(),
      systemPrompt: systemPrompt.trim(),
      model,
      provider: botProvider,
      enabled,
      stars,
      tag: tag.trim() || null,
      temperature,
      maxTokens,
    }

    try {
      await createBot(dto)
      success('Бот создан')
      navigate('/master/bots')
    } catch (e: any) {
      const msg = e.message || 'Ошибка при создании бота'
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Новый бот</h2>
        <Button variant="ghost" onClick={() => navigate('/master/bots')}>
          <X className="h-4 w-4 mr-1" />
          Отмена
        </Button>
      </div>

      <Card className="bg-card border-border shadow-none p-5">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label>Specialist ID <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={specialistId}
                onChange={(e) => setSpecialistId(e.target.value)}
                placeholder="moderator"
              />
              <p className="text-xs text-muted-foreground">Уникальный slug, например: moderator</p>
            </div>
            <div className="space-y-2">
              <Label>Тег</Label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Имя <span className="text-muted-foreground">(обязательно)</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Модератор"
            />
          </div>

          <div className="space-y-2">
            <Label>Описание <span className="text-muted-foreground">(обязательно)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Что делает этот бот..."
              rows={2}
              className="bg-background text-foreground overflow-hidden resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Личность <span className="text-muted-foreground">(обязательно)</span></Label>
            <Textarea
              value={personality}
              onChange={(e) => {
                setPersonality(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Характер и стиль общения..."
              rows={2}
              className="bg-background text-foreground overflow-hidden resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Системный промпт <span className="text-muted-foreground">(обязательно)</span></Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Инструкции для LLM..."
              rows={4}
              className="bg-background text-foreground overflow-hidden resize-none"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>Провайдер</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={botProvider ?? ''}
                onChange={(e) => setBotProvider((e.target.value as BotProvider) || null)}
              >
                <option value="">Глобальный (по умолчанию)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="mistral">Mistral AI</option>
                <option value="ollama">Ollama (локально)</option>
                <option value="local">LM Studio (локально)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>
                Модель{' '}
                <span className="text-muted-foreground text-[11px]">
                  {botProvider === 'ollama' ? '(Ollama)' : botProvider === 'mistral' ? '(Mistral AI)' : botProvider === 'local' ? '(LM Studio)' : botProvider === 'openrouter' ? '(OpenRouter)' : '(глобальный провайдер)'}
                </span>
              </Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={botProvider === 'ollama' ? 'llama3.2' : 'provider/model-name'}
                list="model-suggestions-create"
              />
              <datalist id="model-suggestions-create">
                {botProvider === 'ollama'
                  ? ollamaModels.map((m) => <option key={m} value={m} />)
                  : botProvider === 'mistral'
                  ? MISTRAL_MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)
                  : CLOUD_MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)
                }
              </datalist>
              {botProvider === 'ollama' && ollamaModels.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Ollama не доступна или нет загруженных моделей</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                min={0}
                max={2}
                step={0.1}
                className="w-24"
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
                className="w-28"
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
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label>Включён</Label>
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="bg-success hover:bg-success/90"
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
            >
              {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4 mr-1" />}
              Создать бота
            </Button>
            <Button variant="ghost" onClick={() => navigate('/master/bots')}>Отмена</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
