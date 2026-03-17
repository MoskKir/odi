import { Button, Tag } from '@blueprintjs/core'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'

export function MasterLayout() {
  const theme = useAppSelector((s) => s.app.theme)
  const navigate = useNavigate()

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button icon="arrow-left" minimal small className="!text-odi-text-muted" onClick={() => navigate('/dashboard')} />
          <Tag intent="warning" minimal>МАСТЕР</Tag>
          <span className="font-bold text-odi-text text-sm">Панель управления сессией</span>
        </div>
        <div className="flex items-center gap-2">
          <Button icon="eye-open" minimal small text="Вид игрока" onClick={() => navigate('/game/board')} className="!text-odi-text-muted" />
          <SettingsMenu />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
