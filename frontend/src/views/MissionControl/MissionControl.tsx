import { useState, useEffect } from 'react'
import { Button, Tag, InputGroup, Icon } from '@blueprintjs/core'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ScenarioSelector } from './ScenarioSelector'
import { CrewBuilder } from './CrewBuilder'
import { RecommendedCrew } from './RecommendedCrew'
import { SpecialistGrid } from './SpecialistGrid'
import { SessionSettings } from './SessionSettings'
import { EfficiencyForecast } from './EfficiencyForecast'
import { loadScenarios, loadSession, setTitle } from '@/store/missionSlice'
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
    // If editing an existing session, just navigate to it
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
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{'\u{1F680}'}</span>
          <h1 className="text-lg font-bold text-odi-text m-0">
            ЦЕНТР УПРАВЛЕНИЯ МИССИЕЙ
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SettingsMenu />
          <Tag minimal className="text-xs text-odi-text-muted">
            {'\u26A1'} v2.0.1
          </Tag>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-odi-surface rounded-lg border border-odi-border">
            <div className="p-4 space-y-4">
              <InputGroup
                value={mission.title}
                onChange={(e) => dispatch(setTitle(e.target.value))}
                placeholder="Название миссии *"
                large
                leftIcon="bookmark"
                className="[&_input]:!bg-transparent [&_input]:!text-odi-text"
              />
              <div className="border-t border-odi-border" />
              <ScenarioSelector />
              {selectedScenarioObj && <ScenarioDescription scenario={selectedScenarioObj} />}
              <div className="border-t border-odi-border" />
              <CrewBuilder />
              <div className="border-t border-odi-border" />
              <RecommendedCrew />
            </div>
          </div>

          <SpecialistGrid />
          <SessionSettings />
          <EfficiencyForecast />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-odi-surface border-t border-odi-border px-6 py-4 flex items-center justify-between shrink-0">
        <Button
          icon="arrow-left"
          minimal
          text="К списку игр"
          className="!text-odi-text-muted"
          onClick={() => navigate('/dashboard')}
        />
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-odi-danger">{error}</span>
          )}
          <Button
            icon="rocket-slant"
            intent="success"
            large
            text="ЗАПУСТИТЬ МИССИЮ"
            disabled={!canLaunch || launching}
            loading={launching}
            onClick={handleLaunch}
          />
        </div>
      </footer>
    </div>
  )
}

function ScenarioDescription({ scenario }: { scenario: { subtitle: string; description: string } }) {
  const [expanded, setExpanded] = useState(false)
  const LINE_HEIGHT = 20
  const VISIBLE_LINES = 6
  const collapsedHeight = LINE_HEIGHT * VISIBLE_LINES

  return (
    <div className="bg-odi-bg rounded px-4 py-3">
      <div className="text-xs text-odi-accent font-medium mb-1">{scenario.subtitle}</div>
      <div
        className="text-sm text-odi-text leading-relaxed overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? undefined : collapsedHeight }}
      >
        <Markdown>{scenario.description}</Markdown>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-1 text-xs text-odi-text-muted hover:text-odi-text transition-colors"
      >
        <Icon icon={expanded ? 'chevron-up' : 'chevron-down'} size={12} />
        {expanded ? 'Свернуть' : 'Показать полностью'}
      </button>
    </div>
  )
}
