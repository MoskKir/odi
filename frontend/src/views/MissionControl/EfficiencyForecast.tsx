import { useState } from 'react'
import { ProgressBar, Button, Collapse } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

export function EfficiencyForecast() {
  const { selectedScenario, crewSlots, scenarios } = useAppSelector((s) => s.mission)
  const [isOpen, setIsOpen] = useState(false)

  const filledSlots = crewSlots.filter(Boolean)
  const scenario = scenarios.find((s) => s.slug === selectedScenario)

  let successChance = 40
  if (scenario) {
    const hasRequired = (scenario.requiredBots ?? []).every((r) => crewSlots.includes(r))
    if (hasRequired) successChance += 25
    const recCount = (scenario.recommendedBots ?? []).filter((r) => crewSlots.includes(r)).length
    successChance += recCount * 12
  }
  successChance += filledSlots.length * 5
  successChance = Math.min(successChance, 98)

  const hasPeacemaker = crewSlots.includes('peacemaker')
  const hasProvocateur = crewSlots.includes('provocateur')
  let conflictLevel = 'Средние'
  let conflictColor = 'text-odi-warning'
  if (hasPeacemaker && !hasProvocateur) {
    conflictLevel = 'Низкие'
    conflictColor = 'text-odi-success'
  } else if (hasProvocateur && !hasPeacemaker) {
    conflictLevel = 'Высокие'
    conflictColor = 'text-odi-danger'
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

  const intent = successChance >= 70 ? 'success' : successChance >= 50 ? 'warning' : 'danger'

  return (
    <div>
      <Button
        minimal
        fill
        alignText="left"
        icon={isOpen ? 'chevron-down' : 'chevron-right'}
        className="!text-sm !font-bold !text-odi-text-muted !px-0 !justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        {'\u{1F4CA}'} ПРОГНОЗ — {successChance}%
        <span className="font-normal ml-2 text-xs">
          конфликты: <span className={conflictColor}>{conflictLevel.toLowerCase()}</span>
        </span>
      </Button>
      <Collapse isOpen={isOpen}>
        <div className="bg-odi-surface rounded-lg border border-odi-border p-4 space-y-3 mt-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-odi-text">Шанс на успех</span>
              <span className="text-sm font-bold text-odi-text">{successChance}%</span>
            </div>
            <ProgressBar value={successChance / 100} intent={intent} stripes={false} animate={false} />
          </div>
          <div className="text-sm">
            <span className="text-odi-text-muted">Потенциальные конфликты: </span>
            <span className={conflictColor}>{conflictLevel}</span>
          </div>
          <div className="text-sm">
            <span className="text-odi-text-muted">Рекомендация: </span>
            <span className="text-odi-text">{recommendation}</span>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
