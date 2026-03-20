import { Button, Card, FormGroup, InputGroup, TextArea, Switch, NumericInput } from '@blueprintjs/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBot, type CreateBotDto } from '@/api/bots'

const MODEL_SUGGESTIONS = [
  'google/gemini-2.0-flash-001',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324',
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
  const [model, setModel] = useState(MODEL_SUGGESTIONS[0])
  const [enabled, setEnabled] = useState(true)
  const [stars, setStars] = useState(3)
  const [tag, setTag] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)

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
      enabled,
      stars,
      tag: tag.trim() || null,
      temperature,
      maxTokens,
    }

    try {
      await createBot(dto)
      navigate('/master/bots')
    } catch (e: any) {
      setError(e.message || 'Ошибка при создании бота')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Новый бот</h2>
        <Button minimal icon="cross" text="Отмена" onClick={() => navigate('/master/bots')} />
      </div>

      <Card className="!bg-odi-surface !border-odi-border !shadow-none">
        <div className="space-y-4">
          <div className="flex gap-4">
            <FormGroup label="Specialist ID" className="!mb-0 flex-1" labelInfo="(обязательно)" helperText="Уникальный slug, например: moderator">
              <InputGroup
                value={specialistId}
                onChange={(e) => setSpecialistId(e.target.value)}
                placeholder="moderator"
              />
            </FormGroup>
            <FormGroup label="Тег" className="!mb-0">
              <InputGroup
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Необязательно"
              />
            </FormGroup>
          </div>

          <FormGroup label="Имя" labelInfo="(обязательно)">
            <InputGroup
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Модератор"
            />
          </FormGroup>

          <FormGroup label="Описание" labelInfo="(обязательно)">
            <TextArea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Что делает этот бот..."
              fill
              rows={2}
              className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
            />
          </FormGroup>

          <FormGroup label="Личность" labelInfo="(обязательно)">
            <TextArea
              value={personality}
              onChange={(e) => {
                setPersonality(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Характер и стиль общения..."
              fill
              rows={2}
              className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
            />
          </FormGroup>

          <FormGroup label="Системный промпт" labelInfo="(обязательно)">
            <TextArea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Инструкции для LLM..."
              fill
              rows={4}
              className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
            />
          </FormGroup>

          <div className="flex gap-4 flex-wrap">
            <FormGroup label="Модель" labelInfo="(OpenRouter)" className="!mb-0">
              <InputGroup
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="provider/model-name"
                list="model-suggestions-create"
              />
              <datalist id="model-suggestions-create">
                {MODEL_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
              </datalist>
            </FormGroup>

            <FormGroup label="Temperature" className="!mb-0">
              <NumericInput
                value={temperature}
                onValueChange={(v) => setTemperature(v)}
                min={0}
                max={2}
                stepSize={0.1}
                minorStepSize={0.01}
                className="!w-24"
              />
            </FormGroup>

            <FormGroup label="Max Tokens" className="!mb-0">
              <NumericInput
                value={maxTokens}
                onValueChange={(v) => setMaxTokens(v)}
                min={256}
                max={100000}
                stepSize={256}
                className="!w-28"
              />
            </FormGroup>

            <FormGroup label="Звёзды" className="!mb-0">
              <NumericInput
                value={stars}
                onValueChange={(v) => setStars(v)}
                min={1}
                max={5}
                className="!w-20"
              />
            </FormGroup>
          </div>

          <Switch
            checked={enabled}
            label="Включён"
            onChange={() => setEnabled(!enabled)}
          />

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              intent="success"
              icon="tick"
              text="Создать бота"
              loading={saving}
              disabled={!canSubmit}
              onClick={handleSubmit}
            />
            <Button minimal text="Отмена" onClick={() => navigate('/master/bots')} />
          </div>
        </div>
      </Card>
    </div>
  )
}
