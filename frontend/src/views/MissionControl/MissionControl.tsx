import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Rocket, ChevronUp, ChevronDown, Loader2, LayoutTemplate, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppSelector, useAppDispatch } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ScenarioSelector } from './ScenarioSelector'
import { CrewBuilder } from './CrewBuilder'
import { RecommendedCrew } from './RecommendedCrew'
import { SpecialistGrid } from './SpecialistGrid'
import { SessionSettings } from './SessionSettings'
import { EfficiencyForecast } from './EfficiencyForecast'
import { loadScenarios, loadSession, setTitle, applyTemplate, SESSION_TEMPLATES } from '@/store/missionSlice'
import { createGame } from '@/api/games'
import { Markdown } from '@/components/Markdown'
import { error as toastError } from '@/utils/toaster'

export function MissionControl() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const dispatch = useAppDispatch()
  const mission = useAppSelector((s) => s.mission)
  const theme = useAppSelector((s) => s.app.theme)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mission.scenarios.length === 0) {
      dispatch(loadScenarios())
    }
  }, [dispatch, mission.scenarios.length])

  useEffect(() => {
    if (sessionId) {
      dispatch(loadSession(sessionId))
    }
  }, [dispatch, sessionId])

  const selectedScenarioObj = mission.scenarios.find((s) => s.slug === mission.selectedScenario)
  const canLaunch = mission.title.trim() && mission.selectedScenario && mission.crewSlots.some(Boolean)

  const handleLaunch = async () => {
    if (sessionId) {
      navigate(`/game/board?session=${sessionId}`)
      return
    }

    if (!mission.selectedScenario) return

    const scenario = mission.scenarios.find((s) => s.slug === mission.selectedScenario)
    if (!scenario) return

    setLaunching(true)
    setError('')

    try {
      const specialistIds = mission.crewSlots.filter(Boolean) as string[]

      const game = await createGame({
        title: mission.title.trim(),
        scenarioSlug: mission.selectedScenario,
        difficulty: mission.difficulty,
        durationMinutes: mission.duration || 9999,
        interfaceMode: mission.interfaceMode,
        aiVisibility: mission.aiVisibility,
        crewSize: mission.crewSize + 1,
        specialistIds,
        phases: mission.phases.length > 0 ? mission.phases : undefined,
        boardColumns: mission.boardColumns.length > 0 ? mission.boardColumns : undefined,
      })

      navigate(`/game/board?session=${game.id}`)
    } catch (e: any) {
      const msg = e.message || 'Ошибка создания игры'
      setError(msg)
      toastError(msg)
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen flex flex-col bg-background`}>
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <input
              value={mission.title}
              onChange={(e) => dispatch(setTitle(e.target.value))}
              placeholder="Название миссии..."
              className="w-full bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none truncate"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {error && (
              <span className="text-xs text-destructive max-w-48 truncate">{error}</span>
            )}
            <SettingsMenu />
            <Button
              size="sm"
              className="bg-success hover:bg-success/90"
              disabled={!canLaunch || launching}
              onClick={handleLaunch}
            >
              {launching ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
              )}
              Запустить
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Templates */}
          <TemplateSelector />

          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 space-y-4">
              <ScenarioSelector />
              {selectedScenarioObj && <ScenarioDescription scenario={selectedScenarioObj} />}
              <div className="border-t border-border" />
              <CrewBuilder />
              <div className="border-t border-border" />
              <RecommendedCrew />
            </div>
          </div>

          {/* Phase preview */}
          {mission.phases.length > 0 && <PhasePreview phases={mission.phases} />}

          <SpecialistGrid />
          <SessionSettings />
          <EfficiencyForecast />
        </div>
      </div>
    </div>
  )
}

// ── Template Selector ──

function TemplateSelector() {
  const dispatch = useAppDispatch()
  const selectedTemplate = useAppSelector((s) => s.mission.selectedTemplate)

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground mb-3">
        <LayoutTemplate className="h-3.5 w-3.5" />
        ШАБЛОНЫ
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SESSION_TEMPLATES.map((t) => {
          const isActive = selectedTemplate === t.id
          return (
            <button
              key={t.id}
              onClick={() => dispatch(applyTemplate(isActive ? null : t.id))}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent border-foreground/20'
                  : 'bg-card border-border hover:border-foreground/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">{t.name}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-success" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{t.description}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {t.phases.length} фаз
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {t.specialists.length} бота
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {t.boardColumns.length} колонок
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Phase Preview ──

function PhasePreview({ phases }: { phases: { name: string; durationMinutes: number }[] }) {
  const total = phases.reduce((sum, p) => sum + p.durationMinutes, 0)

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Фазы сессии</span>
        <span className="text-xs text-muted-foreground">{total} мин</span>
      </div>
      <div className="flex gap-1">
        {phases.map((phase, i) => (
          <div
            key={i}
            className="flex-1 bg-muted rounded px-2 py-1.5 min-w-0"
          >
            <div className="text-[11px] text-foreground font-medium truncate">{phase.name}</div>
            <div className="text-[10px] text-muted-foreground">{phase.durationMinutes} мин</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Scenario Description ──

function ScenarioDescription({ scenario }: { scenario: { subtitle: string; description: string } }) {
  const [expanded, setExpanded] = useState(false)
  const LINE_HEIGHT = 20
  const VISIBLE_LINES = 6
  const collapsedHeight = LINE_HEIGHT * VISIBLE_LINES

  return (
    <div className="bg-background rounded px-4 py-3">
      <div className="text-xs text-muted-foreground font-medium mb-1">{scenario.subtitle}</div>
      <div
        className="text-sm text-foreground leading-relaxed overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? undefined : collapsedHeight }}
      >
        <Markdown>{scenario.description}</Markdown>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Свернуть' : 'Показать полностью'}
      </button>
    </div>
  )
}
