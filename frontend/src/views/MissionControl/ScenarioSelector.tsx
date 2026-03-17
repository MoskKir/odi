import { HTMLSelect } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectScenario } from '@/store/missionSlice'

export function ScenarioSelector() {
  const { scenarios, selectedScenario } = useAppSelector((s) => s.mission)
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
          if (val) dispatch(selectScenario(val))
        }}
        className="!text-sm"
        fill
      >
        <option value="">— выберите сценарий —</option>
        {scenarios.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.icon} {s.title} — {s.subtitle}
          </option>
        ))}
      </HTMLSelect>
    </div>
  )
}
