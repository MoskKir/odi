import { Button, Tag, Divider } from '@blueprintjs/core'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import type { ViewMode } from '@/types'

const PAGES = [
  { path: '/', label: 'Games', icon: 'list' as const },
  { path: '/mission', label: 'Mission', icon: 'rocket-slant' as const },
]

const VIEW_MODES: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'board', icon: 'dashboard', label: 'Board' },
  { mode: 'theatre', icon: 'chat', label: 'Theatre' },
  { mode: 'graph', icon: 'graph', label: 'Graph' },
  { mode: 'hq', icon: 'shield', label: 'HQ' },
  { mode: 'aquarium', icon: 'eye-open', label: 'Aquarium' },
  { mode: 'terminal', icon: 'console', label: 'Terminal' },
]

export function DevBar() {
  const devMode = useAppSelector((s) => s.app.devMode)
  const location = useLocation()
  const navigate = useNavigate()

  if (!devMode) return null

  const isGameRoute = location.pathname.startsWith('/game')
  const currentViewMode = isGameRoute ? location.pathname.split('/')[2] : null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-odi-surface border border-odi-accent/50 rounded-lg shadow-lg px-3 py-2 flex items-center gap-1.5">
      <Tag intent="warning" minimal className="text-[10px] mr-1">DEV</Tag>

      {PAGES.map((page) => (
        <Button
          key={page.path}
          icon={page.icon}
          small
          minimal={location.pathname !== page.path}
          intent={location.pathname === page.path ? 'primary' : 'none'}
          onClick={() => navigate(page.path)}
        >
          {page.label}
        </Button>
      ))}

      <Divider className="!mx-1 !h-5" />

      {VIEW_MODES.map(({ mode, icon, label }) => (
        <Button
          key={mode}
          icon={icon as any}
          small
          minimal={currentViewMode !== mode}
          intent={currentViewMode === mode ? 'success' : 'none'}
          onClick={() => navigate(`/game/${mode}`)}
          title={label}
        >
          {label}
        </Button>
      ))}

      <Divider className="!mx-1 !h-5" />

      <span className="text-[10px] text-odi-text-muted font-mono">
        {location.pathname}
      </span>
    </div>
  )
}
