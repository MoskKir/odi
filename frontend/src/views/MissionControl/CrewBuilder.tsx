import { Card, Button, Tag } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { removeFromSlot, setCrewSize, SPECIALISTS } from '@/store/missionSlice'

const MIN_SLOTS = 1
const MAX_SLOTS = 7

export function CrewBuilder() {
  const { crewSlots, crewSize } = useAppSelector((s) => s.mission)
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
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
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${crewSize + 1}, minmax(0, 1fr))` }}>
        {/* Captain slot */}
        <Card className="!bg-odi-accent/10 !border-odi-accent/30 !shadow-none text-center">
          <div className="text-2xl mb-1">{'\u{1F464}'}</div>
          <div className="text-xs font-bold text-odi-accent uppercase">Капитан</div>
          <div className="text-xs text-odi-text-muted mt-1">(Вы)</div>
        </Card>

        {/* AI slots */}
        {crewSlots.map((slotId, index) => {
          const specialist = slotId
            ? SPECIALISTS.find((s) => s.id === slotId)
            : null

          return (
            <Card
              key={index}
              className={`!shadow-none text-center relative ${
                specialist
                  ? '!bg-odi-surface-hover !border-odi-accent/30'
                  : '!bg-odi-surface !border-odi-border border-dashed'
              }`}
            >
              {specialist ? (
                <>
                  <Button
                    icon="cross"
                    minimal
                    small
                    className="!absolute !top-1 !right-1 !text-odi-text-muted"
                    onClick={() => dispatch(removeFromSlot(index))}
                  />
                  <div className="text-2xl mb-1">{'\u{1F916}'}</div>
                  <Tag minimal intent="primary" className="text-[10px]">
                    СЛОТ {index + 1}
                  </Tag>
                  <div className="text-xs font-medium text-odi-text mt-1">
                    {specialist.name}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-1 opacity-30">{'\u{1F916}'}</div>
                  <Tag minimal className="text-[10px]">
                    СЛОТ {index + 1}
                  </Tag>
                  <div className="text-xs text-odi-text-muted mt-1">???</div>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
