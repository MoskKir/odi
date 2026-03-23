import { useRef, useCallback, type ReactNode } from 'react'
import { Button, Collapse, Icon, type IconName } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleRightPanel, toggleRightPanelSection, setRightPanelWidth, syncPreferencesToServer } from '@/store/appSlice'
import type { RightPanelSections } from '@/api/preferences'
import { Markdown } from '../Markdown'
import { BotsList } from './BotsList'
import { MiniChat } from '../Chat/MiniChat'

const MIN_WIDTH = 200
const MAX_WIDTH = 500

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

  if (grow) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        {header}
        {isOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-3">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shrink-0">
      {header}
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

  if (rightPanelCollapsed) {
    return (
      <aside className="bg-odi-surface border-l border-odi-border p-2 flex flex-col items-center shrink-0 h-full">
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
    <aside className="flex shrink-0 h-full overflow-hidden" style={{ width: rightPanelWidth }} data-right-panel>
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
      />

      <div className="flex-1 bg-odi-surface border-l border-odi-border flex flex-col overflow-hidden h-full">
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-odi-border shrink-0">
          <span className="text-xs font-semibold text-odi-text-muted uppercase tracking-wider">Панель</span>
          <Button
            icon="menu-closed"
            minimal
            small
            className="!text-odi-text-muted hover:!text-odi-text !rotate-180"
            onClick={handleToggle}
            title="Свернуть панель"
          />
        </div>

        {/* Scrollable sections */}
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
      </div>
    </aside>
  )
}
