import { Button, Card, FormGroup, InputGroup, TextArea, HTMLSelect, Switch, TagInput } from '@blueprintjs/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createScenario, type CreateScenarioDto } from '@/api/scenarios'
import { success, error as toastError } from '@/utils/toaster'

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

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function ScenarioCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [icon, setIcon] = useState(ICONS[0].value)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [published, setPublished] = useState(false)
  const [requiredBots, setRequiredBots] = useState<string[]>([])
  const [recommendedBots, setRecommendedBots] = useState<string[]>([])
  const [avgDurationMinutes, setAvgDurationMinutes] = useState('')

  const canSubmit = title.trim() && subtitle.trim() && description.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError('')

    const dto: CreateScenarioDto = {
      slug: toSlug(title),
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
      await createScenario(dto)
      success('Сценарий создан')
      navigate('/master/scenarios')
    } catch (e: any) {
      const msg = e.message || 'Ошибка при создании сценария'
      setError(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Новый сценарий</h2>
        <Button minimal icon="cross" text="Отмена" onClick={() => navigate('/master/scenarios')} />
      </div>

      <Card className="!bg-odi-surface !border-odi-border !shadow-none">
        <div className="space-y-4">
          <FormGroup label="Иконка" className="!mb-0">
            <HTMLSelect value={icon} onChange={(e) => setIcon(e.target.value)}>
              {ICONS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </HTMLSelect>
          </FormGroup>

          <FormGroup label="Название" labelInfo="(обязательно)">
            <TextArea
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Например: Бизнес-стратегия"
              fill
              rows={1}
              className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
            />
          </FormGroup>

          <FormGroup label="Подзаголовок" labelInfo="(обязательно)">
            <InputGroup
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Короткое описание в одну строку"
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
              onFocus={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Подробное описание сценария..."
              fill
              rows={3}
              className="!bg-odi-bg !text-odi-text !overflow-hidden !resize-none"
            />
          </FormGroup>

          <div className="flex gap-4">
            <FormGroup label="Сложность" className="!mb-0">
              <HTMLSelect value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </HTMLSelect>
            </FormGroup>

            <FormGroup label="Ср. длительность (мин)" className="!mb-0">
              <InputGroup
                type="number"
                min={0}
                value={avgDurationMinutes}
                onChange={(e) => setAvgDurationMinutes(e.target.value)}
                placeholder="60"
                className="!w-28"
              />
            </FormGroup>
          </div>

          <FormGroup label="Обязательные боты" helperText="Введите slug бота и нажмите Enter">
            <TagInput
              values={requiredBots}
              onChange={(values) => setRequiredBots(values as string[])}
              placeholder="moderator, critic..."
              addOnBlur
              className="!bg-odi-bg"
            />
          </FormGroup>

          <FormGroup label="Рекомендуемые боты" helperText="Введите slug бота и нажмите Enter">
            <TagInput
              values={recommendedBots}
              onChange={(values) => setRecommendedBots(values as string[])}
              placeholder="analyst, visionary..."
              addOnBlur
              className="!bg-odi-bg"
            />
          </FormGroup>

          <Switch
            checked={published}
            label="Опубликовать сразу"
            onChange={() => setPublished(!published)}
          />

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              intent="success"
              icon="tick"
              text="Создать сценарий"
              loading={saving}
              disabled={!canSubmit}
              onClick={handleSubmit}
            />
            <Button minimal text="Отмена" onClick={() => navigate('/master/scenarios')} />
          </div>
        </div>
      </Card>
    </div>
  )
}
