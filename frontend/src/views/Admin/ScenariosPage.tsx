import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Plus,
  ChevronRight,
  Pencil,
  Copy,
  Trash2,
  AlertCircle,
  Map,
} from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import { fetchScenarios, createScenario, deleteScenario, type ScenarioResponse } from '@/api/scenarios'
import { success, error as toastError } from '@/utils/toaster'

const DIFF_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  easy: { label: 'Лёгкий', variant: 'success' },
  medium: { label: 'Средний', variant: 'warning' },
  hard: { label: 'Сложный', variant: 'danger' },
}

function fmtDuration(minutes: number | null): string {
  if (minutes == null) return '--:--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function ScenariosPage() {
  const navigate = useNavigate()
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const loadScenarios = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchScenarios()
      .then((data) => { if (!cancelled) setScenarios(data) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить сценарии') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => loadScenarios(), [loadScenarios])

  const toggle = (id: string) => setExpandedId((prev) => prev === id ? null : id)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteScenario(id)
      setScenarios((prev) => prev.filter((s) => s.id !== id))
      if (expandedId === id) setExpandedId(null)
      success('Сценарий удалён')
    } catch {
      toastError('Не удалось удалить сценарий')
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (scenario: ScenarioResponse) => {
    setDuplicating(scenario.id)
    try {
      const copy = await createScenario({
        slug: `${scenario.slug}-copy-${Date.now()}`,
        icon: scenario.icon,
        title: `${scenario.title} (копия)`,
        subtitle: scenario.subtitle,
        description: scenario.description,
        difficulty: scenario.difficulty as 'easy' | 'medium' | 'hard',
        published: false,
        requiredBots: scenario.requiredBots,
        recommendedBots: scenario.recommendedBots,
        avgDurationMinutes: scenario.avgDurationMinutes,
      })
      setScenarios((prev) => [copy, ...prev])
      success('Сценарий дублирован')
    } catch {
      toastError('Не удалось дублировать сценарий')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Сценарии</h2>
        <Button className="bg-success hover:bg-success/90" onClick={() => navigate('/master/scenarios/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Новый сценарий
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Ошибка</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" onClick={loadScenarios}>Повторить</Button>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Map className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Нет сценариев</h3>
          <p className="text-sm text-muted-foreground">Создайте первый сценарий</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const diff = DIFF_CONFIG[scenario.difficulty]
            const isOpen = expandedId === scenario.id
            return (
              <Card key={scenario.id} className="bg-card border-border shadow-none p-0">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggle(scenario.id)}
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <span className="text-2xl shrink-0">{scenario.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground whitespace-pre-line">{scenario.title}</span>
                        {diff && <Badge variant={diff.variant} className="text-[10px]">{diff.label}</Badge>}
                        {!scenario.published && <Badge variant="warning" className="text-[10px]">Черновик</Badge>}
                      </div>
                      <div className={`text-sm text-muted-foreground ${isOpen ? '' : 'line-clamp-2'}`}>
                        <Markdown>{scenario.description}</Markdown>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Боты: {scenario.requiredBots.join(', ')}</span>
                        <span>{scenario.sessionsCount} сессий</span>
                        <span>Ср. длительность: {fmtDuration(scenario.avgDurationMinutes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 pt-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Редактировать"
                      onClick={() => navigate(`/master/scenarios/${scenario.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Дублировать"
                      disabled={duplicating === scenario.id}
                      onClick={() => handleDuplicate(scenario)}
                    >
                      {duplicating === scenario.id ? <Spinner size={14} /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto">
                        <p className="text-sm text-foreground mb-2">Удалить <strong>{scenario.title}</strong>?</p>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost">Отмена</Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleting === scenario.id}
                            onClick={() => handleDelete(scenario.id)}
                          >
                            {deleting === scenario.id ? <Spinner size={14} /> : 'Удалить'}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
