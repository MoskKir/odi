import { useRef, useCallback } from 'react'
import { Button, ButtonGroup } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleLeftSidebar, setLeftSidebarWidth, syncPreferencesToServer } from '@/store/appSlice'
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

const MIN_WIDTH = 160
const MAX_WIDTH = 400

export function Sidebar() {
  const { leftSidebarCollapsed, leftSidebarWidth } = useAppSelector((s) => s.app)
  const dispatch = useAppDispatch()
  const { viewMode, setViewMode } = useViewMode()
  const isResizing = useRef(false)

  const handleToggle = () => {
    dispatch(toggleLeftSidebar())
    const state = !leftSidebarCollapsed
    dispatch(syncPreferencesToServer({ leftSidebarCollapsed: state }))
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true

    const startX = e.clientX
    const startWidth = leftSidebarWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX)))
      dispatch(setLeftSidebarWidth(newWidth))
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // sync final width to server
      const el = document.querySelector('[data-sidebar]')
      if (el) {
        const w = (el as HTMLElement).offsetWidth
        dispatch(syncPreferencesToServer({ leftSidebarWidth: w }))
      }
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [leftSidebarWidth, dispatch])

  if (leftSidebarCollapsed) {
    return (
      <aside className="bg-odi-surface border-r border-odi-border p-2 flex flex-col items-center shrink-0">
        <Button
          icon="menu-open"
          minimal
          className="!text-odi-text-muted hover:!text-odi-text mb-3"
          onClick={handleToggle}
          title="Развернуть панель"
        />
        <ButtonGroup vertical minimal className="gap-1">
          {VIEW_MODES.map(({ mode, icon, label }) => (
            <Button
              key={mode}
              icon={icon as any}
              active={viewMode === mode}
              onClick={() => setViewMode(mode)}
              className={
                viewMode === mode
                  ? '!bg-odi-accent/20 !text-odi-accent'
                  : '!text-odi-text-muted hover:!text-odi-text hover:!bg-odi-surface-hover'
              }
              title={label}
            />
          ))}
        </ButtonGroup>
      </aside>
    )
  }

  return (
    <aside className="flex shrink-0" style={{ width: leftSidebarWidth }} data-sidebar>
      <div className="flex-1 bg-odi-surface border-r border-odi-border p-3 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="text-xs text-odi-text-muted uppercase tracking-wider">
            Режим обзора
          </div>
          <Button
            icon="menu-closed"
            minimal
            small
            className="!text-odi-text-muted hover:!text-odi-text"
            onClick={handleToggle}
            title="Свернуть панель"
          />
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
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
      />
    </aside>
  )
}
