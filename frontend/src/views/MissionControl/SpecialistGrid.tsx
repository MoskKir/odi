import { Card, Tag } from '@blueprintjs/core'
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

  const handleAdd = (specId: typeof SPECIALISTS[number]['id']) => {
    const emptyIndex = crewSlots.indexOf(null)
    if (emptyIndex === -1) return
    dispatch(assignSlot({ slotIndex: emptyIndex, specialistId: specId }))
  }

  return (
    <div>
      <div className="text-sm font-bold text-odi-text-muted mb-3">
        {'\u{1F3AD}'} ДОСТУПНЫЕ СПЕЦИАЛИСТЫ
        <span className="font-normal ml-2 text-xs">(нажмите, чтобы добавить в слот)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SPECIALISTS.map((spec) => {
          const isAssigned = crewSlots.includes(spec.id)
          return (
            <Card
              key={spec.id}
              interactive={!isAssigned}
              onClick={() => !isAssigned && handleAdd(spec.id)}
              className={`!shadow-none cursor-pointer transition-all ${
                isAssigned
                  ? '!bg-odi-accent/10 !border-odi-accent/30 opacity-60'
                  : '!bg-odi-surface-hover !border-odi-border hover:!border-odi-accent/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{'\u{1F916}'}</span>
                <span className="text-sm font-bold text-odi-text uppercase">
                  {spec.name}
                </span>
              </div>
              <div className="text-xs text-odi-text-muted mb-1">{spec.description}</div>
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
    </div>
  )
}
