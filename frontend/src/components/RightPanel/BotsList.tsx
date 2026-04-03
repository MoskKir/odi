import { useAppSelector, useAppDispatch } from '@/store'
import { setPendingMention } from '@/store/appSlice'

export function BotsList() {
  const bots = useAppSelector((s) => s.app.sessionBots)
  const dispatch = useAppDispatch()

  if (bots.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">Нет ботов в сессии</p>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
      {bots.map((bot) => (
        <div
          key={bot.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors group"
          onClick={() => dispatch(setPendingMention(bot.name))}
          title={`Обратиться к ${bot.name}`}
        >
          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 text-[9px] font-bold text-muted-foreground">
            AI
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-foreground font-medium truncate block leading-tight">{bot.name}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground transition-colors">@</span>
        </div>
      ))}
    </div>
  )
}
