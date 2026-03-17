import { Button } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { autoFillCrew, SCENARIOS, SPECIALISTS } from '@/store/missionSlice'

export function RecommendedCrew() {
  const selectedScenario = useAppSelector((s) => s.mission.selectedScenario)
  const dispatch = useAppDispatch()

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario)

  if (!scenario) {
    return (
      <div>
        <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider mb-3">
          <span className="text-odi-accent mr-2">[3]</span>
          Рекомендованный состав
        </div>
        <p className="text-sm text-odi-text-muted italic">
          Выберите сценарий, чтобы увидеть рекомендации
        </p>
      </div>
    )
  }

  const allRecommended = [...scenario.required, ...scenario.recommended]

  return (
    <div>
      <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider mb-3">
        <span className="text-odi-accent mr-2">[3]</span>
        Рекомендованный состав для этого сценария
      </div>
      <div className="space-y-1.5 mb-3">
        {allRecommended.map((specId) => {
          const spec = SPECIALISTS.find((s) => s.id === specId)
          if (!spec) return null
          const isRequired = scenario.required.includes(specId)
          return (
            <div key={specId} className="flex items-center gap-2 text-sm">
              <span className="text-odi-accent">{'\u{1F539}'}</span>
              <span className="text-odi-text font-medium">{spec.name}</span>
              <span className="text-odi-text-muted">
                ({isRequired ? 'обязательно' : 'рекомендуется'})
              </span>
              <span className="text-odi-text-muted">— {spec.description.toLowerCase()}</span>
            </div>
          )
        })}
      </div>
      <Button
        icon="lightning"
        intent="warning"
        outlined
        text="АВТОПОДБОР СОСТАВА"
        onClick={() => dispatch(autoFillCrew())}
      />
    </div>
  )
}
