import { useRef, useCallback, useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, Collapse, Icon, Menu, MenuItem, type IconName } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleRightPanel, toggleRightPanelSection, setRightPanelWidth, syncPreferencesToServer } from '@/store/appSlice'
import type { RightPanelSections } from '@/api/preferences'
import { Markdown } from '../Markdown'
import { BotsList } from './BotsList'
import { MiniChat } from '../Chat/MiniChat'

const MIN_WIDTH = 200
const MAX_WIDTH = 500
const COLLAPSED_WIDTH = 40

interface ContextMenuState {
  x: number
  y: number
}

function Section({
  icon,
  label,
  sectionKey,
  sections,
  onToggle,
  children,
  grow,
}: {
  icon: IconName
  label: string
  sectionKey: keyof RightPanelSections
  sections: RightPanelSections
  onToggle: (key: keyof RightPanelSections) => void
  children: ReactNode
  grow?: boolean
}) {
  const isOpen = !!sections[sectionKey]
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    // mousedown instead of click so the menu closes on outside interaction
    // but MenuItem onClick (which fires on click) still works
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', close, true)
    }
  }, [ctxMenu])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const header = (
    <button
      onClick={() => onToggle(sectionKey)}
      className="w-full flex items-center gap-2 px-2 py-1.5 -mx-0.5 rounded hover:bg-odi-surface-hover transition-colors select-none group shrink-0"
    >
      <Icon
        icon={icon}
        size={13}
        className="text-odi-text-muted group-hover:text-odi-text transition-colors shrink-0"
      />
      <span className="text-xs font-medium text-odi-text-muted group-hover:text-odi-text uppercase tracking-wide flex-1 text-left transition-colors">
        {label}
      </span>
      <Icon
        icon="chevron-down"
        size={12}
        className={`text-odi-text-muted transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
      />
    </button>
  )

  const contextMenu = ctxMenu && createPortal(
    <div
      className="fixed z-50"
      style={{ left: ctxMenu.x, top: ctxMenu.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Menu className="bp5-elevation-2">
        <MenuItem
          icon={isOpen ? 'chevron-up' : 'chevron-down'}
          text={isOpen ? 'Свернуть' : 'Развернуть'}
          onClick={() => {
            onToggle(sectionKey)
            setCtxMenu(null)
          }}
        />
      </Menu>
    </div>,
    document.body,
  )

  if (grow) {
    return (
      <div className="flex-1 min-h-0 flex flex-col" onContextMenu={handleContextMenu}>
        {header}
        {contextMenu}
        {isOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-3">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shrink-0" onContextMenu={handleContextMenu}>
      {header}
      {contextMenu}
      <Collapse isOpen={isOpen}>
        <div className="pt-2 pb-3">
          {children}
        </div>
      </Collapse>
    </div>
  )
}

export function RightPanel() {
  const { rightPanelCollapsed, rightPanelWidth, rightPanelSections, scenarioInfo } = useAppSelector((s) => s.app)
  const dispatch = useAppDispatch()
  const isResizing = useRef(false)

  const handleToggle = () => {
    dispatch(toggleRightPanel())
    const state = !rightPanelCollapsed
    dispatch(syncPreferencesToServer({ rightPanelCollapsed: state }))
  }

  const handleSectionToggle = (key: keyof RightPanelSections) => {
    dispatch(toggleRightPanelSection(key))
    const next = !rightPanelSections[key]
    dispatch(syncPreferencesToServer({
      rightPanelSections: { ...rightPanelSections, [key]: next },
    }))
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

  const currentWidth = rightPanelCollapsed ? COLLAPSED_WIDTH : rightPanelWidth

  return (
    <aside
      className="flex shrink-0 h-full transition-[width] duration-300 ease-in-out"
      style={{ width: currentWidth }}
      data-right-panel
    >
      {/* Resize handle */}
      {!rightPanelCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
        />
      )}

      <div className="flex-1 bg-odi-surface border-l border-odi-border flex flex-col overflow-hidden h-full">
        {/* Panel header */}
        <div className={`flex items-center shrink-0 border-b border-odi-border ${rightPanelCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'}`}>
          {!rightPanelCollapsed && (
            <span className="text-xs font-semibold text-odi-text-muted uppercase tracking-wider whitespace-nowrap overflow-hidden">Панель</span>
          )}
          <Button
            icon={rightPanelCollapsed ? 'menu-open' : 'menu-closed'}
            minimal
            small
            className={`!text-odi-text-muted hover:!text-odi-text shrink-0 ${rightPanelCollapsed ? '' : '!rotate-180'}`}
            onClick={handleToggle}
            title={rightPanelCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
          />
        </div>

        {/* Scrollable sections */}
        {!rightPanelCollapsed && (
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col">
            {/* Scenario */}
            {scenarioInfo && (
              <Section
                icon="manual"
                label="Сценарий"
                sectionKey="scenario"
                sections={rightPanelSections}
                onToggle={handleSectionToggle}
              >
                {scenarioInfo.subtitle && (
                  <p className="text-xs text-odi-accent mb-2 font-medium">{scenarioInfo.subtitle}</p>
                )}
                <div className="text-sm text-odi-text leading-relaxed">
                  <Markdown>{scenarioInfo.description}</Markdown>
                </div>
              </Section>
            )}

            {/* Bots */}
            <Section
              icon="people"
              label="Боты"
              sectionKey="bots"
              sections={rightPanelSections}
              onToggle={handleSectionToggle}
            >
              <BotsList />
            </Section>

            {/* Chat */}
            <Section
              icon="chat"
              label="Чат"
              sectionKey="chat"
              sections={rightPanelSections}
              onToggle={handleSectionToggle}
              grow
            >
              <MiniChat />
            </Section>
          </div>
        )}
      </div>
    </aside>
  )
}
