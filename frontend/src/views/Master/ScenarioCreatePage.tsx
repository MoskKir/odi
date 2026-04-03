import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Plus } from 'lucide-react'
import { createScenario, type CreateScenarioDto } from '@/api/scenarios'
import { success, error as toastError } from '@/utils/toaster'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

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

  // Tag input state
  const [requiredInput, setRequiredInput] = useState('')
  const [recommendedInput, setRecommendedInput] = useState('')

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

  const addTag = (list: 'required' | 'recommended') => {
    const input = list === 'required' ? requiredInput : recommendedInput
    const setInput = list === 'required' ? setRequiredInput : setRecommendedInput
    const setter = list === 'required' ? setRequiredBots : setRecommendedBots
    const val = input.trim()
    if (!val) return
    setter((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setInput('')
  }

  const removeTag = (list: 'required' | 'recommended', value: string) => {
    const setter = list === 'required' ? setRequiredBots : setRecommendedBots
    setter((prev) => prev.filter((v) => v !== value))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Новый сценарий</h2>
        <Button variant="ghost" onClick={() => navigate('/master/scenarios')}>
          <X className="h-4 w-4 mr-1" />
          Отмена
        </Button>
      </div>

      <Card className="bg-card border-border shadow-none p-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Иконка</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Название <span className="text-muted-foreground">(обязательно)</span></Label>
            <Textarea
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Например: Бизнес-стратегия"
              rows={1}
              className="bg-background text-foreground overflow-hidden resize-none"
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

          <div className="space-y-2">
            <Label>Описание <span className="text-muted-foreground">(обязательно)</span></Label>
            <Textarea
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
              rows={3}
              className="bg-background text-foreground overflow-hidden resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Сложность</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Лёгкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="hard">Сложный</SelectItem>
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
                className="w-28"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Обязательные боты</Label>
            <p className="text-xs text-muted-foreground">Введите slug бота и нажмите Enter</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {requiredBots.map((b) => (
                <Badge key={b} variant="outline" className="gap-1">
                  {b}
                  <button onClick={() => removeTag('required', b)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={requiredInput}
                onChange={(e) => setRequiredInput(e.target.value)}
                placeholder="moderator, critic..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('required'))}
                onBlur={() => addTag('required')}
                className="flex-1 bg-background"
              />
              <Button variant="ghost" size="icon" onClick={() => addTag('required')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Рекомендуемые боты</Label>
            <p className="text-xs text-muted-foreground">Введите slug бота и нажмите Enter</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {recommendedBots.map((b) => (
                <Badge key={b} variant="outline" className="gap-1">
                  {b}
                  <button onClick={() => removeTag('recommended', b)} className="ml-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={recommendedInput}
                onChange={(e) => setRecommendedInput(e.target.value)}
                placeholder="analyst, visionary..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('recommended'))}
                onBlur={() => addTag('recommended')}
                className="flex-1 bg-background"
              />
              <Button variant="ghost" size="icon" onClick={() => addTag('recommended')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label>Опубликовать сразу</Label>
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
              Создать сценарий
            </Button>
            <Button variant="ghost" onClick={() => navigate('/master/scenarios')}>Отмена</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
