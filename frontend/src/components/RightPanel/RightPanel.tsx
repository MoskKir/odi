import { useRef, useCallback } from 'react'
import { Card, Button } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleRightPanel, setRightPanelWidth, syncPreferencesToServer } from '@/store/appSlice'
import { useViewMode } from '@/hooks/useViewMode'
import { EmotionCompass } from './EmotionCompass'
import { BotsList } from './BotsList'
import { MiniChat } from '../Chat/MiniChat'

const MIN_WIDTH = 200
const MAX_WIDTH = 500

export function RightPanel() {
  const { rightPanelCollapsed, rightPanelWidth } = useAppSelector((s) => s.app)
  const dispatch = useAppDispatch()
  const { viewMode } = useViewMode()
  const isResizing = useRef(false)

  const handleToggle = () => {
    dispatch(toggleRightPanel())
    const state = !rightPanelCollapsed
    dispatch(syncPreferencesToServer({ rightPanelCollapsed: state }))
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true

    const startX = e.clientX
    const startWidth = rightPanelWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth - (ev.clientX - startX)))
      dispatch(setRightPanelWidth(newWidth))
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // sync final width to server
      const el = document.querySelector('[data-right-panel]')
      if (el) {
        const w = (el as HTMLElement).offsetWidth
        dispatch(syncPreferencesToServer({ rightPanelWidth: w }))
      }
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [rightPanelWidth, dispatch])

  if (rightPanelCollapsed) {
    return (
      <aside className="bg-odi-surface border-l border-odi-border p-2 flex flex-col items-center shrink-0">
        <Button
          icon="menu-open"
          minimal
          className="!text-odi-text-muted hover:!text-odi-text !rotate-180"
          onClick={handleToggle}
          title="Развернуть панель"
        />
      </aside>
    )
  }

  return (
    <aside className="flex shrink-0" style={{ width: rightPanelWidth }} data-right-panel>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
      />

      <div className="flex-1 bg-odi-surface border-l border-odi-border p-3 flex flex-col gap-3 overflow-hidden h-full">
        <div className="flex items-center justify-between shrink-0">
          <div className="text-xs text-odi-text-muted uppercase tracking-wider">Панель</div>
          <Button
            icon="menu-closed"
            minimal
            small
            className="!text-odi-text-muted hover:!text-odi-text !rotate-180"
            onClick={handleToggle}
            title="Свернуть панель"
          />
        </div>

        <div className="shrink-0">
          <EmotionCompass />
        </div>

        {(viewMode === 'theatre' || viewMode === 'graph') && (
          <div className="shrink-0 max-h-[30%] overflow-y-auto">
            <Card className="!bg-odi-surface-hover !border-odi-border !shadow-none">
              <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
                Мета-взгляд
              </div>
              <p className="text-sm text-odi-text">
                Стратегия Модератора: проверка стрессоустойчивости команды
              </p>
              <div className="mt-2">
                <span className="text-xs text-odi-text-muted">Прогноз успеха:</span>
                <div className="w-full bg-odi-bg rounded-full h-2 mt-1">
                  <div className="bg-odi-accent h-2 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="shrink-0 max-h-[30%] overflow-y-auto">
          <BotsList />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <MiniChat />
        </div>
      </div>
    </aside>
  )
}
