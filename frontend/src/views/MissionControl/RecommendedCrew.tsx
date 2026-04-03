import { Zap, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector, useAppDispatch } from '@/store'
import { autoFillCrew, SPECIALISTS } from '@/store/missionSlice'

export function RecommendedCrew() {
  const { scenarios, selectedScenario } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  const scenario = scenarios.find((s) => s.slug === selectedScenario)

  if (!scenario) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-bold uppercase tracking-wider shrink-0">
          <Lightbulb className="h-3.5 w-3.5" />
          Рекомендации
        </div>
        <span className="text-xs text-muted-foreground italic">
          Выберите сценарий
        </span>
      </div>
    )
  }

  const allRecommended = [...(scenario.requiredBots ?? []), ...(scenario.recommendedBots ?? [])]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-bold uppercase tracking-wider shrink-0">
        <Lightbulb className="h-3.5 w-3.5" />
        Рекомендации
      </div>
      {allRecommended.map((specId) => {
        const spec = SPECIALISTS.find((s) => s.id === specId)
        if (!spec) return null
        const isRequired = (scenario.requiredBots ?? []).includes(specId)
        return (
          <Badge
            key={specId}
            variant={isRequired ? 'danger' : 'outline'}
            className="text-xs"
          >
            {spec.name}
            <span className="text-muted-foreground ml-1">
              ({isRequired ? 'обяз.' : 'рек.'})
            </span>
          </Badge>
        )
      })}
      <Button
        variant="outline"
        size="sm"
        className="border-warning text-warning hover:bg-warning/10"
        onClick={() => dispatch(autoFillCrew())}
      >
        <Zap className="h-4 w-4 mr-1" />
        АВТОПОДБОР
      </Button>
    </div>
  )
}
