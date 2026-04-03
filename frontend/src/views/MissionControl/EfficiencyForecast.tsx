import { useState } from 'react'
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppSelector } from '@/store'
import type { SpecialistId } from '@/types'

export function EfficiencyForecast() {
  const { selectedScenario, crewSlots, scenarios } = useAppSelector((s) => s.mission)
  const [isOpen, setIsOpen] = useState(false)

  const filledSlots = crewSlots.filter(Boolean)
  const scenario = scenarios.find((s) => s.slug === selectedScenario)

  let successChance = 40
  if (scenario) {
    const hasRequired = (scenario.requiredBots ?? []).every((r) => crewSlots.includes(r as SpecialistId | null))
    if (hasRequired) successChance += 25
    const recCount = (scenario.recommendedBots ?? []).filter((r) => crewSlots.includes(r as SpecialistId | null)).length
    successChance += recCount * 12
  }
  successChance += filledSlots.length * 5
  successChance = Math.min(successChance, 98)

  const hasPeacemaker = crewSlots.includes('peacemaker')
  const hasProvocateur = crewSlots.includes('provocateur')
  let conflictLevel = 'Средние'
  let conflictColor = 'text-warning'
  if (hasPeacemaker && !hasProvocateur) {
    conflictLevel = 'Низкие'
    conflictColor = 'text-success'
  } else if (hasProvocateur && !hasPeacemaker) {
    conflictLevel = 'Высокие'
    conflictColor = 'text-destructive'
  }

  const hasCritic = crewSlots.includes('critic')
  const hasVisionary = crewSlots.includes('visionary')
  let recommendation = 'Добавьте специалистов'
  if (hasCritic && hasVisionary) {
    recommendation = 'Отличный баланс'
  } else if (filledSlots.length === 3) {
    recommendation = 'Команда укомплектована'
  } else if (filledSlots.length === 0) {
    recommendation = 'Выберите специалистов'
  }

  const indicatorColor =
    successChance >= 70
      ? 'bg-success'
      : successChance >= 50
        ? 'bg-warning'
        : 'bg-destructive'

  return (
    <div>
      <Button
        variant="ghost"
        className="text-sm font-bold text-muted-foreground px-0 justify-start w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <BarChart3 className="h-3.5 w-3.5 mr-1" />
        ПРОГНОЗ — {successChance}%
        <span className="font-normal ml-2 text-xs">
          конфликты: <span className={conflictColor}>{conflictLevel.toLowerCase()}</span>
        </span>
      </Button>
      {isOpen && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3 mt-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">Шанс на успех</span>
              <span className="text-sm font-bold text-foreground">{successChance}%</span>
            </div>
            <Progress value={successChance} indicatorClassName={indicatorColor} />
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Потенциальные конфликты: </span>
            <span className={conflictColor}>{conflictLevel}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Рекомендация: </span>
            <span className="text-foreground">{recommendation}</span>
          </div>
        </div>
      )}
    </div>
  )
}
