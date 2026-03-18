import { Card, Tag, Button, Icon, Spinner, NonIdealState, Popover } from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchScenarios, createScenario, deleteScenario, type ScenarioResponse } from '@/api/scenarios'

const DIFF_CONFIG: Record<string, { label: string; intent: 'success' | 'warning' | 'danger' }> = {
  easy: { label: 'Лёгкий', intent: 'success' },
  medium: { label: 'Средний', intent: 'warning' },
  hard: { label: 'Сложный', intent: 'danger' },
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
    } catch {
      setError('Не удалось удалить сценарий')
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
    } catch {
      setError('Не удалось дублировать сценарий')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Сценарии</h2>
        <Button icon="plus" intent="success" text="Новый сценарий" onClick={() => navigate('/master/scenarios/new')} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={loadScenarios} />}
        />
      ) : scenarios.length === 0 ? (
        <NonIdealState icon="map" title="Нет сценариев" description="Создайте первый сценарий" />
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const diff = DIFF_CONFIG[scenario.difficulty]
            const isOpen = expandedId === scenario.id
            return (
              <Card key={scenario.id} className="!bg-odi-surface !border-odi-border !shadow-none !p-0">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggle(scenario.id)}
                  >
                    <Icon
                      icon="chevron-right"
                      className={`text-odi-text-muted mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <span className="text-2xl shrink-0">{scenario.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-odi-text whitespace-pre-line">{scenario.title}</span>
                        {diff && <Tag intent={diff.intent} minimal round className="text-[10px]">{diff.label}</Tag>}
                        {!scenario.published && <Tag minimal intent="warning" className="text-[10px]">Черновик</Tag>}
                      </div>
                      <div className={`text-sm text-odi-text-muted whitespace-pre-line ${isOpen ? '' : 'line-clamp-2'}`}>
                        {scenario.description}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-odi-text-muted mt-2">
                        <span>Боты: {scenario.requiredBots.join(', ')}</span>
                        <span>{scenario.sessionsCount} сессий</span>
                        <span>Ср. длительность: {fmtDuration(scenario.avgDurationMinutes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 pt-0.5">
                    <Button icon="edit" minimal small title="Редактировать" onClick={() => navigate(`/master/scenarios/${scenario.id}/edit`)} />
                    <Button
                      icon="duplicate"
                      minimal
                      small
                      title="Дублировать"
                      loading={duplicating === scenario.id}
                      onClick={() => handleDuplicate(scenario)}
                    />
                    <Popover
                      placement="bottom-end"
                      content={
                        <div className="p-3">
                          <p className="text-sm text-odi-text mb-2">Удалить <strong>{scenario.title}</strong>?</p>
                          <div className="flex gap-2 justify-end">
                            <Button small minimal text="Отмена" className="bp5-popover-dismiss" />
                            <Button
                              small
                              intent="danger"
                              text="Удалить"
                              loading={deleting === scenario.id}
                              onClick={() => handleDelete(scenario.id)}
                            />
                          </div>
                        </div>
                      }
                    >
                      <Button icon="trash" minimal small intent="danger" title="Удалить" />
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
