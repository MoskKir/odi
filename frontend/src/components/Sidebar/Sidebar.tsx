import { useRef, useCallback, useState } from 'react'
import { Button, ButtonGroup } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleLeftSidebar, setLeftSidebarWidth, setQuickAddCard, syncPreferencesToServer } from '@/store/appSlice'
import { useViewMode } from '@/hooks/useViewMode'
import { EmotionWheel } from '@/components/EmotionWheel'
import type { ViewMode } from '@/types'

const VIEW_MODES: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'board', icon: 'th-derived', label: 'Доска' },
  { mode: 'theatre', icon: 'chat', label: 'Театр' },
  { mode: 'aquarium', icon: 'eye-open', label: 'Аквариум' },
  { mode: 'terminal', icon: 'console', label: 'Терминал' },
]

const MIN_WIDTH = 160
const MAX_WIDTH = 400
const COLLAPSED_WIDTH = 48

export function Sidebar() {
  const { leftSidebarCollapsed, leftSidebarWidth } = useAppSelector((s) => s.app)
  const dispatch = useAppDispatch()
  const { viewMode, setViewMode } = useViewMode()
  const isResizing = useRef(false)
  const [emotionWheelOpen, setEmotionWheelOpen] = useState(false)

  const handleToggle = () => {
    dispatch(toggleLeftSidebar())
    const state = !leftSidebarCollapsed
    dispatch(syncPreferencesToServer({ leftSidebarCollapsed: state }))
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (leftSidebarCollapsed) return
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
  }, [leftSidebarWidth, leftSidebarCollapsed, dispatch])

  const currentWidth = leftSidebarCollapsed ? COLLAPSED_WIDTH : leftSidebarWidth

  return (
    <aside
      className="flex shrink-0 h-full transition-[width] duration-300 ease-in-out"
      style={{ width: currentWidth }}
      data-sidebar
    >
      <div className="flex-1 bg-odi-surface border-r border-odi-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center shrink-0 ${leftSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-3'}`}>
          {!leftSidebarCollapsed && (
            <div className="text-xs text-odi-text-muted uppercase tracking-wider whitespace-nowrap overflow-hidden">
              Режим обзора
            </div>
          )}
          <Button
            icon={leftSidebarCollapsed ? 'menu-open' : 'menu-closed'}
            minimal
            small
            className="!text-odi-text-muted hover:!text-odi-text shrink-0"
            onClick={handleToggle}
            title={leftSidebarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
          />
        </div>

        {/* View modes */}
        <div className={`${leftSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          <ButtonGroup vertical minimal className="gap-1 w-full">
            {VIEW_MODES.map(({ mode, icon, label }) => (
              <Button
                key={mode}
                icon={icon as any}
                text={leftSidebarCollapsed ? undefined : label}
                active={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={
                  viewMode === mode
                    ? '!bg-odi-accent/20 !text-odi-accent'
                    : '!text-odi-text-muted hover:!text-odi-text hover:!bg-odi-surface-hover'
                }
                alignText="left"
                title={leftSidebarCollapsed ? label : undefined}
              />
            ))}
          </ButtonGroup>
        </div>

        {/* Quick actions */}
        <div className={`border-t border-odi-border pt-3 mt-auto mb-3 ${leftSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {!leftSidebarCollapsed && (
            <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2 whitespace-nowrap overflow-hidden">
              Быстрые действия
            </div>
          )}
          <ButtonGroup vertical minimal className="gap-1 w-full">
            <Button icon="pin" text={leftSidebarCollapsed ? undefined : 'На доску'} alignText="left" className="!text-odi-text-muted hover:!text-odi-text" title={leftSidebarCollapsed ? 'На доску' : undefined} onClick={() => dispatch(setQuickAddCard(true))} />
            <Button icon="heart" text={leftSidebarCollapsed ? undefined : 'Атмосфера'} alignText="left" className="!text-odi-text-muted hover:!text-odi-text" title={leftSidebarCollapsed ? 'Атмосфера' : undefined} onClick={() => setEmotionWheelOpen(true)} />
          </ButtonGroup>
        </div>
      </div>

      {/* Resize handle */}
      {!leftSidebarCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
        />
      )}

      <EmotionWheel isOpen={emotionWheelOpen} onClose={() => setEmotionWheelOpen(false)} />
    </aside>
  )
}
