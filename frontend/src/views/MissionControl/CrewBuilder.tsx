import { Button, Tag } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { removeFromSlot, setCrewSize, SPECIALISTS } from '@/store/missionSlice'

const MIN_SLOTS = 1
const MAX_SLOTS = 7

export function CrewBuilder() {
  const { crewSlots, crewSize } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-odi-text-muted text-sm font-bold uppercase tracking-wider">
          <span className="text-odi-accent mr-2">[2]</span>
          Состав команды
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-odi-text-muted">Слотов:</span>
          <Button
            icon="minus"
            minimal
            small
            disabled={crewSize <= MIN_SLOTS}
            onClick={() => dispatch(setCrewSize(crewSize - 1))}
          />
          <span className="text-sm font-bold text-odi-text w-5 text-center">
            {crewSize}
          </span>
          <Button
            icon="plus"
            minimal
            small
            disabled={crewSize >= MAX_SLOTS}
            onClick={() => dispatch(setCrewSize(crewSize + 1))}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Captain */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-odi-accent/10 border border-odi-accent/30">
          <span className="text-sm">{'\u{1F464}'}</span>
          <span className="text-xs font-bold text-odi-accent uppercase">Капитан (Вы)</span>
        </div>

        {/* AI slots */}
        {crewSlots.map((slotId, index) => {
          const specialist = slotId ? SPECIALISTS.find((s) => s.id === slotId) : null

          return specialist ? (
            <div
              key={index}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-odi-surface-hover border border-odi-accent/30"
            >
              <span className="text-sm">{'\u{1F916}'}</span>
              <Tag minimal intent="primary" className="text-[10px]">
                {index + 1}
              </Tag>
              <span className="text-xs font-medium text-odi-text">{specialist.name}</span>
              <Button
                icon="cross"
                minimal
                small
                className="!text-odi-text-muted !p-0 !min-h-0 !min-w-0"
                onClick={() => dispatch(removeFromSlot(index))}
              />
            </div>
          ) : (
            <div
              key={index}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-odi-surface border border-dashed border-odi-border"
            >
              <span className="text-sm opacity-30">{'\u{1F916}'}</span>
              <Tag minimal className="text-[10px]">
                {index + 1}
              </Tag>
              <span className="text-xs text-odi-text-muted">???</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
