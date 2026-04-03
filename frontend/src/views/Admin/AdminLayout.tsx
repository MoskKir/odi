import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { AppMenu } from '@/components/AppMenu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, LayoutDashboard, Users, Play, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Пользователи', icon: Users },
  { path: '/admin/sessions', label: 'Сессии', icon: Play },
  { path: '/admin/system', label: 'Система', icon: Settings },
]

export function AdminLayout() {
  const theme = useAppSelector((s) => s.app.theme)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen flex flex-col bg-background`}>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant="danger">ADMIN</Badge>
          <h1 className="text-lg font-bold text-foreground m-0">Панель управления</h1>
        </div>
        <div className="flex items-center gap-2">
          <AppMenu />
          <AccountBadge />
          <SettingsMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 bg-card border-r border-border p-3 shrink-0">
          <div className="flex flex-col gap-1 w-full">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(path)
              return (
                <Button
                  key={path}
                  variant="ghost"
                  className={`justify-start gap-2 ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => navigate(path)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              )
            })}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
