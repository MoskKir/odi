import { Button, ButtonGroup, Tag } from '@blueprintjs/core'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'

const NAV_ITEMS = [
  { path: '/admin', label: 'Дашборд', icon: 'dashboard' as const },
  { path: '/admin/users', label: 'Пользователи', icon: 'people' as const },
  { path: '/admin/sessions', label: 'Сессии', icon: 'play' as const },
  { path: '/admin/system', label: 'Система', icon: 'cog' as const },
]

export function AdminLayout() {
  const theme = useAppSelector((s) => s.app.theme)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button icon="arrow-left" minimal className="!text-odi-text-muted" onClick={() => navigate('/dashboard')} />
          <Tag intent="danger" minimal>ADMIN</Tag>
          <h1 className="text-lg font-bold text-odi-text m-0">Панель управления</h1>
        </div>
        <div className="flex items-center gap-2">
          <AccountBadge />
          <SettingsMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 bg-odi-surface border-r border-odi-border p-3 shrink-0">
          <ButtonGroup vertical minimal className="gap-1 w-full">
            {NAV_ITEMS.map(({ path, label, icon }) => {
              const isActive = path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(path)
              return (
                <Button
                  key={path}
                  icon={icon}
                  text={label}
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
            })}
          </ButtonGroup>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
