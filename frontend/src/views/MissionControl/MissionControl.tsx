import { useState, useEffect } from 'react'
import { Button, Tag, InputGroup } from '@blueprintjs/core'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ScenarioSelector } from './ScenarioSelector'
import { CrewBuilder } from './CrewBuilder'
import { RecommendedCrew } from './RecommendedCrew'
import { SpecialistGrid } from './SpecialistGrid'
import { SessionSettings } from './SessionSettings'
import { EfficiencyForecast } from './EfficiencyForecast'
import { loadScenarios, setTitle } from '@/store/missionSlice'
import { createGame } from '@/api/games'

export function MissionControl() {
  const navigate = useNavigate()
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

  const canLaunch = mission.title.trim() && mission.selectedScenario && mission.crewSlots.some(Boolean)

  const handleLaunch = async () => {
    if (!mission.selectedScenario) return

    const scenario = mission.scenarios.find((s) => s.slug === mission.selectedScenario)
    if (!scenario) return

    setLaunching(true)
    setError('')

    try {
      const specialistIds = mission.crewSlots.filter(Boolean) as string[]

      await createGame({
        title: mission.title.trim(),
        scenarioSlug: mission.selectedScenario,
        difficulty: mission.difficulty,
        durationMinutes: mission.duration || 9999,
        interfaceMode: mission.interfaceMode,
        aiVisibility: mission.aiVisibility,
        crewSize: mission.crewSize + 1,
        specialistIds,
      })

      navigate('/game')
    } catch (e: any) {
      setError(e.message || 'Ошибка создания игры')
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
