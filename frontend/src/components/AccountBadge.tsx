import { User } from 'lucide-react'
import { useAppSelector } from '@/store'

export function AccountBadge() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  if (!isAuthenticated || !user) return null

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="text-sm text-foreground font-medium max-w-[120px] truncate hidden sm:inline">
        {user.name}
      </span>
    </div>
  )
}
