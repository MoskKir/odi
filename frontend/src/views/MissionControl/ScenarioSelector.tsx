import { Map } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectScenario } from '@/store/missionSlice'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export function ScenarioSelector() {
  const { scenarios, selectedScenario } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-bold uppercase tracking-wider shrink-0">
        <Map className="h-3.5 w-3.5" />
        Сценарий
      </div>
      <Select
        value={selectedScenario ?? ''}
        onValueChange={(val) => {
          if (val) dispatch(selectScenario(val))
        }}
      >
        <SelectTrigger className="w-full text-sm">
          <SelectValue placeholder="— выберите сценарий —" />
        </SelectTrigger>
        <SelectContent>
          {scenarios.map((s) => (
            <SelectItem key={s.slug} value={s.slug}>
              {s.icon} {s.title} — {s.subtitle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
