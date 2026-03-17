import { ProgressBar } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { SCENARIOS } from '@/store/missionSlice'

export function EfficiencyForecast() {
  const { selectedScenario, crewSlots } = useAppSelector((s) => s.mission)

  const filledSlots = crewSlots.filter(Boolean)
  const scenario = SCENARIOS.find((s) => s.id === selectedScenario)

  // Calculate success chance based on crew composition
  let successChance = 40 // base

  if (scenario) {
    const hasRequired = scenario.required.every((r) => crewSlots.includes(r))
    if (hasRequired) successChance += 25
    const recCount = scenario.recommended.filter((r) => crewSlots.includes(r)).length
    successChance += recCount * 12
  }
  successChance += filledSlots.length * 5
  successChance = Math.min(successChance, 98)

  // Conflict assessment
  const hasPeacemaker = crewSlots.includes('peacemaker')
  const hasProvocateur = crewSlots.includes('provocateur')
  let conflictLevel = 'Средние'
  let conflictColor = 'text-odi-warning'
  if (hasPeacemaker && !hasProvocateur) {
    conflictLevel = 'Низкие (благодаря Миротворцу)'
    conflictColor = 'text-odi-success'
  } else if (hasProvocateur && !hasPeacemaker) {
    conflictLevel = 'Высокие (Провокатор без Миротворца)'
    conflictColor = 'text-odi-danger'
  }

  // Recommendation
  const hasCritic = crewSlots.includes('critic')
  const hasVisionary = crewSlots.includes('visionary')
  let recommendation = 'Добавьте специалистов для оценки'
  if (hasCritic && hasVisionary) {
    recommendation = 'Отличный баланс креатива и критики'
  } else if (filledSlots.length === 3) {
    recommendation = 'Команда укомплектована'
  } else if (filledSlots.length === 0) {
    recommendation = 'Выберите специалистов для начала миссии'
  }

  const intent = successChance >= 70 ? 'success' : successChance >= 50 ? 'warning' : 'danger'

  return (
    <div>
      <div className="text-sm font-bold text-odi-text-muted mb-3">
        {'\u{1F4CA}'} ПРОГНОЗ ЭФФЕКТИВНОСТИ
      </div>
      <div className="bg-odi-surface rounded-lg border border-odi-border p-4 space-y-3">
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
    </div>
  )
}
