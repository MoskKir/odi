import { Button, ButtonGroup, Tag, Tooltip } from '@blueprintjs/core'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { ScenarioHints } from './panels/ScenarioHints'

const NAV_ITEMS = [
  { path: '/master', label: 'Дашборд', icon: 'dashboard' as const },
  { path: '/master/scenarios', label: 'Сценарии', icon: 'map' as const },
  { path: '/master/bots', label: 'AI-боты', icon: 'cube' as const },
]

export function MasterLayout() {
  const theme = useAppSelector((s) => s.app.theme)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qs = searchParams.toString()
  const [collapsed, setCollapsed] = useState(false)
  const [hintsCollapsed, setHintsCollapsed] = useState(false)

  const showHints = location.pathname.startsWith('/master/scenarios')

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button icon="arrow-left" minimal small className="!text-odi-text-muted" onClick={() => navigate('/dashboard')} />
          <Tag intent="warning" minimal>МАСТЕР</Tag>
          <span className="font-bold text-odi-text text-sm">Панель управления</span>
        </div>
        <div className="flex items-center gap-2">
          <Button icon="eye-open" minimal small text="Вид игрока" onClick={() => navigate(`/game/board${qs ? `?${qs}` : ''}`)} className="!text-odi-text-muted" />
          <AccountBadge />
          <SettingsMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${collapsed ? 'w-12' : 'w-52'} bg-odi-surface border-r border-odi-border p-2 shrink-0 flex flex-col transition-all duration-200`}>
          <Button
            icon={collapsed ? 'chevron-right' : 'chevron-left'}
            minimal
            small
            className="!text-odi-text-muted mb-2 self-end"
            onClick={() => setCollapsed(!collapsed)}
          />
          <ButtonGroup vertical minimal className="gap-1 w-full">
            {NAV_ITEMS.map(({ path, label, icon }) => {
              const isActive = path === '/master'
                ? location.pathname === '/master'
                : location.pathname.startsWith(path)
              const btn = (
                <Button
                  key={path}
                  icon={icon}
                  text={collapsed ? undefined : label}
                  alignText="left"
                  active={isActive}
                  onClick={() => navigate(path)}
                  className={
                    isActive
                      ? '!bg-odi-accent/20 !text-odi-accent'
                      : '!text-odi-text-muted hover:!text-odi-text hover:!bg-odi-surface-hover'
                  }
                />
              )
              return collapsed ? (
                <Tooltip key={path} content={label} placement="right">
                  {btn}
                </Tooltip>
              ) : btn
            })}
          </ButtonGroup>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Right hints panel (scenarios pages only) */}
        {showHints && (
          hintsCollapsed ? (
            <aside className="bg-odi-surface border-l border-odi-border p-2 flex flex-col items-center shrink-0 h-full">
              <Button
                icon="menu-open"
                minimal
                className="!text-odi-text-muted hover:!text-odi-text !rotate-180"
                onClick={() => setHintsCollapsed(false)}
                title="Показать подсказки"
              />
            </aside>
          ) : (
            <aside className="w-72 bg-odi-surface border-l border-odi-border shrink-0 h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-end px-2 py-1 shrink-0">
                <Button
                  icon="menu-closed"
                  minimal
                  small
                  className="!text-odi-text-muted hover:!text-odi-text !rotate-180"
                  onClick={() => setHintsCollapsed(true)}
                  title="Свернуть подсказки"
                />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScenarioHints />
              </div>
            </aside>
          )
        )}
      </div>
    </div>
  )
}
