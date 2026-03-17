import { Button, Tag } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { autoFillCrew, SPECIALISTS } from '@/store/missionSlice'

export function RecommendedCrew() {
  const { scenarios, selectedScenario } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  const scenario = scenarios.find((s) => s.slug === selectedScenario)

  if (!scenario) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider shrink-0">
          <span className="text-odi-accent mr-2">[3]</span>
          Рекомендации
        </div>
        <span className="text-xs text-odi-text-muted italic">
          Выберите сценарий
        </span>
      </div>
    )
  }

  const allRecommended = [...(scenario.requiredBots ?? []), ...(scenario.recommendedBots ?? [])]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider shrink-0">
        <span className="text-odi-accent mr-2">[3]</span>
        Рекомендации
      </div>
      {allRecommended.map((specId) => {
        const spec = SPECIALISTS.find((s) => s.id === specId)
        if (!spec) return null
        const isRequired = (scenario.requiredBots ?? []).includes(specId)
        return (
          <Tag
            key={specId}
            minimal
            intent={isRequired ? 'danger' : 'none'}
            className="text-xs"
          >
            {spec.name}
            <span className="text-odi-text-muted ml-1">
              ({isRequired ? 'обяз.' : 'рек.'})
            </span>
          </Tag>
        )
      })}
      <Button
        icon="lightning"
        intent="warning"
        outlined
        small
        text="АВТОПОДБОР"
        onClick={() => dispatch(autoFillCrew())}
      />
    </div>
  )
}
