import { useState } from 'react'
import { ChevronDown, ChevronRight, Star, Bot, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector, useAppDispatch } from '@/store'
import { assignSlot, SPECIALISTS } from '@/store/missionSlice'

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < count ? 'text-warning fill-warning' : 'text-border'}`}
        />
      ))}
    </span>
  )
}

export function SpecialistGrid() {
  const crewSlots = useAppSelector((s) => s.mission.crewSlots)
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(true)

  const assignedCount = crewSlots.filter(Boolean).length

  const handleAdd = (specId: typeof SPECIALISTS[number]['id']) => {
    const emptyIndex = crewSlots.indexOf(null)
    if (emptyIndex === -1) return
    dispatch(assignSlot({ slotIndex: emptyIndex, specialistId: specId }))
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="text-sm font-bold text-muted-foreground px-0 justify-start w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
        ДОСТУПНЫЕ СПЕЦИАЛИСТЫ
        <span className="font-normal ml-2 text-xs">
          ({assignedCount} в команде)
        </span>
      </Button>
      {isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {SPECIALISTS.map((spec) => {
            const isAssigned = crewSlots.includes(spec.id)
            return (
              <div
                key={spec.id}
                onClick={() => !isAssigned && handleAdd(spec.id)}
                className={`rounded-lg border p-2 cursor-pointer transition-all ${
                  isAssigned
                    ? 'bg-accent border-border opacity-60'
                    : 'bg-muted border-border hover:border-foreground/30'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase">
                    {spec.name}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mb-0.5">{spec.description}</div>
                <div className="flex items-center justify-between">
                  <Stars count={spec.stars} />
                  {spec.tag && (
                    <Badge variant={spec.tag === 'редкий' ? 'warning' : 'default'} className="text-[10px]">
                      {spec.tag}
                    </Badge>
                  )}
                  {isAssigned && (
                    <Badge variant="success" className="text-[10px]">
                      в команде
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
