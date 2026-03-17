import { Card } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { useViewMode } from '@/hooks/useViewMode'
import { EmotionCompass } from './EmotionCompass'
import { BotsList } from './BotsList'
import { MiniChat } from '../Chat/MiniChat'

export function RightPanel() {
  const { rightPanelCollapsed } = useAppSelector((s) => s.app)
  const { viewMode } = useViewMode()

  if (rightPanelCollapsed) return null

  return (
    <aside className="w-64 bg-odi-surface border-l border-odi-border p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
      <EmotionCompass />

      {(viewMode === 'theatre' || viewMode === 'graph') && (
        <Card className="!bg-odi-surface-hover !border-odi-border !shadow-none">
          <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
            Мета-взгляд
          </div>
          <p className="text-sm text-odi-text">
            Стратегия Модератора: проверка стрессоустойчивости команды
          </p>
          <div className="mt-2">
            <span className="text-xs text-odi-text-muted">Прогноз успеха:</span>
            <div className="w-full bg-odi-bg rounded-full h-2 mt-1">
              <div className="bg-odi-accent h-2 rounded-full" style={{ width: '40%' }} />
            </div>
          </div>
        </Card>
      )}

      <BotsList />

      <MiniChat />
    </aside>
  )
}
