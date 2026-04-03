import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, LayoutDashboard, Rocket, Wand2, Shield, LogOut } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { logout } from '@/store/authSlice'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export function AppMenu() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isAuthenticated || !user) return null

  const role = user.role ?? 'user'
  const isAdmin = role === 'admin'
  const isModerator = role === 'moderator' || isAdmin

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate('/dashboard')}
          className={location.pathname === '/dashboard' ? 'bg-accent' : ''}
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Мои игры
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate('/mission')}
          className={location.pathname === '/mission' ? 'bg-accent' : ''}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Новая миссия
        </DropdownMenuItem>

        {isModerator && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/master')}
              className={location.pathname.startsWith('/master') ? 'bg-accent' : ''}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Мастер-панель
            </DropdownMenuItem>
          </>
        )}

        {isAdmin && (
          <DropdownMenuItem
            onClick={() => navigate('/admin')}
            className={location.pathname.startsWith('/admin') ? 'bg-accent' : ''}
          >
            <Shield className="h-4 w-4 mr-2" />
            Администрирование
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
