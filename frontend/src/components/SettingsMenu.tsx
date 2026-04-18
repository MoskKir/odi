import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Settings, LogOut, Zap, Moon, Minus, Plus, Home, List, Rocket,
  Crown, Shield, LogIn, UserPlus, LayoutDashboard, MessageSquare,
  GitGraph, Eye, Terminal, Cpu,
} from 'lucide-react'
import { fetchLlmSettings, updateLlmSettings, type LlmSettings } from '@/api/llm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '@/store'
import { setTheme, setFontSize, toggleDevMode } from '@/store/appSlice'
import { logout } from '@/store/authSlice'
import type { ViewMode } from '@/types'
import type { LucideIcon } from 'lucide-react'

const MIN_FONT = 12
const MAX_FONT = 24
const STEP = 1

const PAGES: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/', label: 'Landing', icon: Home },
  { path: '/dashboard', label: 'Game List', icon: List },
  { path: '/mission', label: 'Mission Control', icon: Rocket },
  { path: '/master', label: 'Game Master', icon: Crown },
  { path: '/admin', label: 'Admin Panel', icon: Shield },
  { path: '/login', label: 'Login', icon: LogIn },
  { path: '/register', label: 'Register', icon: UserPlus },
]

const VIEW_MODES: { mode: ViewMode; icon: LucideIcon; label: string }[] = [
  { mode: 'board', icon: LayoutDashboard, label: 'Board' },
  { mode: 'theatre', icon: MessageSquare, label: 'Theatre' },
  { mode: 'graph', icon: GitGraph, label: 'Graph' },
  { mode: 'hq', icon: Shield, label: 'HQ' },
  { mode: 'aquarium', icon: Eye, label: 'Aquarium' },
  { mode: 'terminal', icon: Terminal, label: 'Terminal' },
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

  const { isAuthenticated: isAuth } = useAppSelector((s) => s.auth)
  const [ollamaUrlDraft, setOllamaUrlDraft] = useState('http://localhost:11434/v1')
  const [ollamaSaving, setOllamaSaving] = useState(false)

  useEffect(() => {
    if (!isAuth) return
    fetchLlmSettings()
      .then((s) => setOllamaUrlDraft(s.ollamaBaseUrl))
      .catch(() => {})
  }, [isAuth])

  const saveOllamaUrl = async () => {
    setOllamaSaving(true)
    try {
      await updateLlmSettings({ ollamaBaseUrl: ollamaUrlDraft })
    } catch (e) {
      console.error('Failed to update Ollama URL', e)
    } finally {
      setOllamaSaving(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isAuthenticated && user && (
          <>
            <DropdownMenuLabel>Аккаунт</DropdownMenuLabel>
            <div className="px-2 py-1.5">
              <div className="text-sm text-foreground font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                dispatch(logout())
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Тема</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => dispatch(setTheme('light'))}
          className={theme === 'light' ? 'bg-muted' : ''}
        >
          <Zap className="h-4 w-4" />
          Светлая
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => dispatch(setTheme('dark'))}
          className={theme === 'dark' ? 'bg-muted' : ''}
        >
          <Moon className="h-4 w-4" />
          Тёмная
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Размер шрифта</DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={fontSize <= MIN_FONT}
              onClick={() => dispatch(setFontSize(Math.max(MIN_FONT, fontSize - STEP)))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-mono text-foreground min-w-[40px] text-center">
              {fontSize}px
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={fontSize >= MAX_FONT}
              onClick={() => dispatch(setFontSize(Math.min(MAX_FONT, fontSize + STEP)))}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              <Cpu className="h-3.5 w-3.5 inline mr-1" />
              Ollama URL
            </DropdownMenuLabel>
            <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
              <Input
                className="h-7 text-[11px] px-2"
                value={ollamaUrlDraft}
                disabled={ollamaSaving}
                onChange={(e) => setOllamaUrlDraft(e.target.value)}
                onBlur={saveOllamaUrl}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveOllamaUrl() } }}
                placeholder="http://localhost:11434/v1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Провайдер выбирается в настройках каждого бота</p>
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Разработчик</DropdownMenuLabel>
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Switch
              checked={devMode}
              onCheckedChange={() => dispatch(toggleDevMode())}
              id="dev-mode"
            />
            <Label htmlFor="dev-mode" className="text-sm cursor-pointer">
              Режим разработчика
            </Label>
          </div>
        </div>
        {devMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Навигация</DropdownMenuLabel>
            <div className="px-3 py-1">
              <Badge variant="warning" className="text-[10px]">
                {location.pathname}
              </Badge>
            </div>
            {PAGES.map((page) => {
              const PageIcon = page.icon
              return (
                <DropdownMenuItem
                  key={page.path}
                  onClick={() => navigate(page.path)}
                  className={location.pathname === page.path ? 'bg-muted' : ''}
                >
                  <PageIcon className="h-4 w-4" />
                  {page.label}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Game Views</DropdownMenuLabel>
            {VIEW_MODES.map(({ mode, icon: ModeIcon, label }) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => {
                  const qs = searchParams.toString()
                  navigate(`/game/${mode}${qs ? `?${qs}` : ''}`)
                }}
                className={currentViewMode === mode ? 'bg-muted' : ''}
              >
                <ModeIcon className="h-4 w-4" />
                {label}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
