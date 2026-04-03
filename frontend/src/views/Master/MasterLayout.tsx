import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams, Outlet } from 'react-router-dom'
import { ArrowLeft, ChevronRight, ChevronLeft, Eye, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { AppMenu } from '@/components/AppMenu'
import { ScenarioHints } from './panels/ScenarioHints'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { LayoutDashboard, Map, Box } from 'lucide-react'

const NAV_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  map: Map,
  cube: Box,
}

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
    <TooltipProvider>
      <div className={`${theme === 'dark' ? 'dark' : ''} h-screen flex flex-col bg-background`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge variant="warning">МАСТЕР</Badge>
            <span className="font-bold text-foreground text-sm">Панель управления</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate(`/game/board${qs ? `?${qs}` : ''}`)}>
              <Eye className="h-4 w-4 mr-1" />
              Вид игрока
            </Button>
            <AppMenu />
            <AccountBadge />
            <SettingsMenu />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className={`${collapsed ? 'w-12' : 'w-52'} bg-card border-r border-border p-2 shrink-0 flex flex-col transition-all duration-200`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground mb-2 self-end"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="flex flex-col gap-1 w-full">
              {NAV_ITEMS.map(({ path, label, icon }) => {
                const isActive = path === '/master'
                  ? location.pathname === '/master'
                  : location.pathname.startsWith(path)
                const IconComp = NAV_ICONS[icon]
                const btn = (
                  <Button
                    key={path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(path)}
                    className={`w-full justify-start gap-2 ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <IconComp className="h-4 w-4 shrink-0" />
                    {!collapsed && label}
                  </Button>
                )
                return collapsed ? (
                  <Tooltip key={path}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ) : btn
              })}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>

          {/* Right hints panel (scenarios pages only) */}
          {showHints && (
            hintsCollapsed ? (
              <aside className="bg-card border-l border-border p-2 flex flex-col items-center shrink-0 h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setHintsCollapsed(false)}
                  title="Показать подсказки"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </aside>
            ) : (
              <aside className="w-72 bg-card border-l border-border shrink-0 h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-end px-2 py-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setHintsCollapsed(true)}
                    title="Свернуть подсказки"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScenarioHints />
                </div>
              </aside>
            )
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
