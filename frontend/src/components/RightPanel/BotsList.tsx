import { useAppSelector } from '@/store'

export function BotsList() {
  const bots = useAppSelector((s) => s.app.sessionBots)

  if (bots.length === 0) {
    return (
      <p className="text-xs text-odi-text-muted italic">Нет ботов в сессии</p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-odi-bg/50 border border-odi-border/50"
        >
          <div className="w-7 h-7 rounded-full bg-odi-accent/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-odi-accent">AI</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-odi-text font-medium truncate">{bot.name}</div>
            <div className="text-[11px] text-odi-text-muted truncate leading-tight">{bot.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
