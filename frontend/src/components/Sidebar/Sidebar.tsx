import { useRef, useCallback, useState } from 'react'
import { PanelLeftOpen, PanelLeftClose, LayoutDashboard, MessageSquare, Eye, Terminal, Pin, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleLeftSidebar, setLeftSidebarWidth, setQuickAddCard, syncPreferencesToServer } from '@/store/appSlice'
import { useViewMode } from '@/hooks/useViewMode'
import { EmotionWheel } from '@/components/EmotionWheel'
import type { ViewMode } from '@/types'
import type { LucideIcon } from 'lucide-react'

const VIEW_MODES: { mode: ViewMode; icon: LucideIcon; label: string }[] = [
  { mode: 'board', icon: LayoutDashboard, label: 'Доска' },
  { mode: 'theatre', icon: MessageSquare, label: 'Театр' },
  { mode: 'aquarium', icon: Eye, label: 'Аквариум' },
  { mode: 'terminal', icon: Terminal, label: 'Терминал' },
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
      <div className="flex-1 bg-card border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center shrink-0 ${leftSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-3'}`}>
          {!leftSidebarCollapsed && (
            <div className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap overflow-hidden">
              Режим обзора
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleToggle}
            title={leftSidebarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
          >
            {leftSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* View modes */}
        <div className={`flex flex-col gap-1 ${leftSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {VIEW_MODES.map(({ mode, icon: ModeIcon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(mode)}
              className={`justify-start ${
                viewMode === mode
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              } ${leftSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={leftSidebarCollapsed ? label : undefined}
            >
              <ModeIcon className="h-4 w-4 shrink-0" />
              {!leftSidebarCollapsed && <span>{label}</span>}
            </Button>
          ))}
        </div>

        {/* Quick actions */}
        <div className={`border-t border-border pt-3 mt-auto mb-3 ${leftSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {!leftSidebarCollapsed && (
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 whitespace-nowrap overflow-hidden">
              Быстрые действия
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start text-muted-foreground hover:text-foreground ${leftSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={leftSidebarCollapsed ? 'На доску' : undefined}
              onClick={() => dispatch(setQuickAddCard(true))}
            >
              <Pin className="h-4 w-4 shrink-0" />
              {!leftSidebarCollapsed && <span>На доску</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start text-muted-foreground hover:text-foreground ${leftSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={leftSidebarCollapsed ? 'Атмосфера' : undefined}
              onClick={() => setEmotionWheelOpen(true)}
            >
              <Heart className="h-4 w-4 shrink-0" />
              {!leftSidebarCollapsed && <span>Атмосфера</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Resize handle */}
      {!leftSidebarCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize hover:bg-border active:bg-muted-foreground transition-colors"
        />
      )}

      <EmotionWheel isOpen={emotionWheelOpen} onClose={() => setEmotionWheelOpen(false)} />
    </aside>
  )
}
