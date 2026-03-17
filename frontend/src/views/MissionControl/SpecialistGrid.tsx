import { useState } from 'react'
import { Card, Tag, Button, Collapse } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { assignSlot, SPECIALISTS } from '@/store/missionSlice'

function Stars({ count }: { count: number }) {
  return (
    <span className="text-xs">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? 'text-odi-warning' : 'text-odi-border'}>
          {'\u2605'}
        </span>
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
        minimal
        fill
        alignText="left"
        icon={isOpen ? 'chevron-down' : 'chevron-right'}
        className="!text-sm !font-bold !text-odi-text-muted !px-0 !justify-start"
        onClick={() => setIsOpen(!isOpen)}
      >
        {'\u{1F3AD}'} ДОСТУПНЫЕ СПЕЦИАЛИСТЫ
        <span className="font-normal ml-2 text-xs">
          ({assignedCount} в команде)
        </span>
      </Button>
      <Collapse isOpen={isOpen}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {SPECIALISTS.map((spec) => {
            const isAssigned = crewSlots.includes(spec.id)
            return (
              <Card
                key={spec.id}
                interactive={!isAssigned}
                onClick={() => !isAssigned && handleAdd(spec.id)}
                className={`!shadow-none !p-2 cursor-pointer transition-all ${
                  isAssigned
                    ? '!bg-odi-accent/10 !border-odi-accent/30 opacity-60'
                    : '!bg-odi-surface-hover !border-odi-border hover:!border-odi-accent/50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{'\u{1F916}'}</span>
                  <span className="text-xs font-bold text-odi-text uppercase">
                    {spec.name}
                  </span>
                </div>
                <div className="text-[11px] text-odi-text-muted mb-0.5">{spec.description}</div>
                <div className="flex items-center justify-between">
                  <Stars count={spec.stars} />
                  {spec.tag && (
                    <Tag minimal intent={spec.tag === 'редкий' ? 'warning' : 'primary'} className="text-[10px]">
                      {spec.tag}
                    </Tag>
                  )}
                  {isAssigned && (
                    <Tag minimal intent="success" className="text-[10px]">
                      в команде
                    </Tag>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </Collapse>
    </div>
  )
}
