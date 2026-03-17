import { HTMLSelect } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectScenario, SCENARIOS } from '@/store/missionSlice'

export function ScenarioSelector() {
  const selectedScenario = useAppSelector((s) => s.mission.selectedScenario)
  const dispatch = useAppDispatch()

  return (
    <div className="flex items-center gap-3">
      <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider shrink-0">
        <span className="text-odi-accent mr-2">[1]</span>
        Сценарий
      </div>
      <HTMLSelect
        value={selectedScenario ?? ''}
        onChange={(e) => {
          const val = e.currentTarget.value
          if (val) dispatch(selectScenario(val as typeof SCENARIOS[number]['id']))
        }}
        className="!text-sm"
        fill
      >
        <option value="">— выберите сценарий —</option>
        {SCENARIOS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon} {s.title} — {s.subtitle}
          </option>
        ))}
      </HTMLSelect>
    </div>
  )
}
