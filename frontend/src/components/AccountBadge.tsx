import { Icon } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

export function AccountBadge() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)

  if (!isAuthenticated || !user) return null

  return (
    <div className="flex items-center gap-2">
      <Icon icon="user" className="text-odi-text-muted" size={14} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-odi-text font-medium">{user.name}</span>
        <span className="text-[11px] text-odi-text-muted">{user.email}</span>
      </div>
    </div>
  )
}
