import { Minus, Plus, X, Users, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector, useAppDispatch } from '@/store'
import { removeFromSlot, setCrewSize, SPECIALISTS } from '@/store/missionSlice'

const MIN_SLOTS = 1

export function CrewBuilder() {
  const { crewSlots, crewSize } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-bold uppercase tracking-wider">
          <Users className="h-3.5 w-3.5" />
          Состав команды
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Слотов:</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            disabled={crewSize <= MIN_SLOTS}
            onClick={() => dispatch(setCrewSize(crewSize - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-bold text-foreground w-5 text-center">
            {crewSize}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => dispatch(setCrewSize(crewSize + 1))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Captain */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent border border-border">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground uppercase">Капитан (Вы)</span>
        </div>

        {/* AI slots */}
        {crewSlots.map((slotId, index) => {
          const specialist = slotId ? SPECIALISTS.find((s) => s.id === slotId) : null

          return specialist ? (
            <div
              key={index}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border"
            >
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="default" className="text-[10px]">
                {index + 1}
              </Badge>
              <span className="text-xs font-medium text-foreground">{specialist.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground h-4 w-4 p-0"
                onClick={() => dispatch(removeFromSlot(index))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              key={index}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card border border-dashed border-border"
            >
              <Bot className="h-3.5 w-3.5 text-muted-foreground/30" />
              <Badge variant="outline" className="text-[10px]">
                {index + 1}
              </Badge>
              <span className="text-xs text-muted-foreground">???</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
