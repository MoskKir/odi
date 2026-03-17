import { Tag } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

export function BotsList() {
  const bots = useAppSelector((s) => s.app.sessionBots)

  if (bots.length === 0) return null

  return (
    <div>
      <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
        Боты
      </div>
      <div className="flex flex-col gap-1">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="flex items-center gap-2 p-2 rounded bg-odi-surface-hover"
          >
            <Tag intent="primary" round minimal className="shrink-0">
              AI
            </Tag>
            <div className="min-w-0">
              <div className="text-sm text-odi-text truncate">{bot.name}</div>
              <div className="text-xs text-odi-text-muted truncate">{bot.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
