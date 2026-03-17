import { Button, ButtonGroup } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { useViewMode } from '@/hooks/useViewMode'
import type { ViewMode } from '@/types'

const VIEW_MODES: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'board', icon: 'dashboard', label: 'Доска' },
  { mode: 'theatre', icon: 'chat', label: 'Театр' },
  { mode: 'graph', icon: 'graph', label: 'Граф' },
  { mode: 'hq', icon: 'shield', label: 'Штаб' },
  { mode: 'aquarium', icon: 'eye-open', label: 'Аквариум' },
  { mode: 'terminal', icon: 'console', label: 'Терминал' },
]

export function Sidebar() {
  const { leftSidebarCollapsed } = useAppSelector((s) => s.app)
  const { viewMode, setViewMode } = useViewMode()

  if (leftSidebarCollapsed) return null

  return (
    <aside className="w-52 bg-odi-surface border-r border-odi-border p-3 flex flex-col gap-4 shrink-0">
      <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-1">
        Режим обзора
      </div>
      <ButtonGroup vertical minimal className="gap-1">
        {VIEW_MODES.map(({ mode, icon, label }) => (
          <Button
            key={mode}
            icon={icon as any}
            text={label}
            active={viewMode === mode}
            onClick={() => setViewMode(mode)}
            className={
              viewMode === mode
                ? '!bg-odi-accent/20 !text-odi-accent'
                : '!text-odi-text-muted hover:!text-odi-text hover:!bg-odi-surface-hover'
            }
            alignText="left"
          />
        ))}
      </ButtonGroup>

      <div className="border-t border-odi-border pt-3 mt-auto">
        <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
          Быстрые действия
        </div>
        <ButtonGroup vertical minimal className="gap-1">
          <Button icon="pin" text="На доску" alignText="left" className="!text-odi-text-muted hover:!text-odi-text" />
          <Button icon="link" text="Связать" alignText="left" className="!text-odi-text-muted hover:!text-odi-text" />
          <Button icon="lightbulb" text="Анализ AI" alignText="left" className="!text-odi-text-muted hover:!text-odi-text" />
          <Button icon="heart" text="Атмосфера" alignText="left" className="!text-odi-text-muted hover:!text-odi-text" />
        </ButtonGroup>
      </div>
    </aside>
  )
}
