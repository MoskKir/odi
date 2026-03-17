import { Button, Popover, Menu, MenuItem, MenuDivider, Switch, Tag } from '@blueprintjs/core'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setTheme, setFontSize, toggleDevMode } from '@/store/appSlice'
import { logout } from '@/store/authSlice'
import type { ViewMode } from '@/types'

const MIN_FONT = 12
const MAX_FONT = 24
const STEP = 1

const PAGES = [
  { path: '/', label: 'Landing', icon: 'home' as const },
  { path: '/dashboard', label: 'Game List', icon: 'list' as const },
  { path: '/mission', label: 'Mission Control', icon: 'rocket-slant' as const },
  { path: '/master', label: 'Game Master', icon: 'crown' as const },
  { path: '/admin', label: 'Admin Panel', icon: 'shield' as const },
  { path: '/login', label: 'Login', icon: 'log-in' as const },
  { path: '/register', label: 'Register', icon: 'new-person' as const },
]

const VIEW_MODES: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'board', icon: 'dashboard', label: 'Board' },
  { mode: 'theatre', icon: 'chat', label: 'Theatre' },
  { mode: 'graph', icon: 'graph', label: 'Graph' },
  { mode: 'hq', icon: 'shield', label: 'HQ' },
  { mode: 'aquarium', icon: 'eye-open', label: 'Aquarium' },
  { mode: 'terminal', icon: 'console', label: 'Terminal' },
]

export function SettingsMenu() {
  const { theme, fontSize, devMode } = useAppSelector((s) => s.app)
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const currentViewMode = location.pathname.startsWith('/game')
    ? location.pathname.split('/')[2]
    : null

  const content = (
    <Menu className="!bg-odi-surface !text-odi-text">
      {isAuthenticated && user && (
        <>
          <MenuDivider title="Аккаунт" />
          <li className="px-3 py-1.5">
            <div className="text-sm text-odi-text font-medium">{user.name}</div>
            <div className="text-xs text-odi-text-muted">{user.email}</div>
          </li>
          <MenuItem
            icon="log-out"
            text="Выйти"
            intent="danger"
            onClick={() => {
              dispatch(logout())
              navigate('/login')
            }}
          />
        </>
      )}
      <MenuDivider title="Тема" />
      <MenuItem
        icon="flash"
        text="Светлая"
        active={theme === 'light'}
        onClick={() => dispatch(setTheme('light'))}
      />
      <MenuItem
        icon="moon"
        text="Тёмная"
        active={theme === 'dark'}
        onClick={() => dispatch(setTheme('dark'))}
      />
      <MenuDivider title="Размер шрифта" />
      <li className="px-2 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <Button
            icon="minus"
            minimal
            small
            disabled={fontSize <= MIN_FONT}
            onClick={() => dispatch(setFontSize(Math.max(MIN_FONT, fontSize - STEP)))}
          />
          <span className="text-sm font-mono text-odi-text min-w-[40px] text-center">
            {fontSize}px
          </span>
          <Button
            icon="plus"
            minimal
            small
            disabled={fontSize >= MAX_FONT}
            onClick={() => dispatch(setFontSize(Math.min(MAX_FONT, fontSize + STEP)))}
          />
        </div>
      </li>
      <MenuDivider title="Разработчик" />
      <li className="px-3 py-1.5">
        <Switch
          checked={devMode}
          label="Режим разработчика"
          onChange={() => dispatch(toggleDevMode())}
          className="!mb-0 !text-sm"
        />
      </li>
      {devMode && (
        <>
          <MenuDivider title="Навигация" />
          <li className="px-3 py-1">
            <Tag intent="warning" minimal className="text-[10px]">
              {location.pathname}
            </Tag>
          </li>
          {PAGES.map((page) => (
            <MenuItem
              key={page.path}
              icon={page.icon}
              text={page.label}
              active={location.pathname === page.path}
              onClick={() => navigate(page.path)}
            />
          ))}
          <MenuDivider title="Game Views" />
          {VIEW_MODES.map(({ mode, icon, label }) => (
            <MenuItem
              key={mode}
              icon={icon as any}
              text={label}
              active={currentViewMode === mode}
              onClick={() => {
                const qs = searchParams.toString()
                navigate(`/game/${mode}${qs ? `?${qs}` : ''}`)
              }}
            />
          ))}
        </>
      )}
    </Menu>
  )

  return (
    <Popover content={content} placement="bottom-end">
      <Button icon="cog" minimal className="!text-odi-text-muted" />
    </Popover>
  )
}
