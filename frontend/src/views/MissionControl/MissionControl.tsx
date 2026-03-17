import { Button, Tag } from '@blueprintjs/core'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { ScenarioSelector } from './ScenarioSelector'
import { CrewBuilder } from './CrewBuilder'
import { RecommendedCrew } from './RecommendedCrew'
import { SpecialistGrid } from './SpecialistGrid'
import { SessionSettings } from './SessionSettings'
import { EfficiencyForecast } from './EfficiencyForecast'

export function MissionControl() {
  const navigate = useNavigate()
  const { selectedScenario, crewSlots } = useAppSelector((s) => s.mission)
  const theme = useAppSelector((s) => s.app.theme)

  const canLaunch = selectedScenario && crewSlots.some(Boolean)

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
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-odi-surface rounded-lg border border-odi-border">
            <div className="border-b border-odi-border px-5 py-3">
              <h2 className="text-sm font-bold text-odi-text uppercase tracking-wider m-0">
                Формирование экипажа
              </h2>
            </div>
            <div className="p-5 space-y-6">
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
          onClick={() => navigate('/')}
        />
        <Button
          icon="rocket-slant"
          intent="success"
          large
          text="ЗАПУСТИТЬ МИССИЮ"
          disabled={!canLaunch}
          onClick={() => navigate('/game')}
        />
      </footer>
    </div>
  )
}
