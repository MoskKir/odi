import { Card } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectScenario, SCENARIOS } from '@/store/missionSlice'

export function ScenarioSelector() {
  const selectedScenario = useAppSelector((s) => s.mission.selectedScenario)
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider mb-3">
        <span className="text-odi-accent mr-2">[1]</span>
        Выберите сценарий
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => {
          const isSelected = selectedScenario === scenario.id
          return (
            <Card
              key={scenario.id}
              interactive
              onClick={() => dispatch(selectScenario(scenario.id))}
              className={`!shadow-none cursor-pointer transition-all ${
                isSelected
                  ? '!bg-odi-accent/15 !border-odi-accent ring-1 ring-odi-accent'
                  : '!bg-odi-surface-hover !border-odi-border hover:!border-odi-accent/50'
              }`}
            >
              <div className="text-3xl mb-2">{scenario.icon}</div>
              <div className="text-sm font-bold text-odi-text">{scenario.title}</div>
              <div className="text-xs text-odi-text-muted mt-1">{scenario.subtitle}</div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
