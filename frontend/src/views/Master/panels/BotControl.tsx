import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw, MessageSquare, Hand, Bot } from 'lucide-react'
import { useAppSelector } from '@/store'
import { getSocket } from '@/api/socket'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function BotControl() {
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const socketJoined = useAppSelector((s) => s.app.socketJoined)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const bots = participants.filter((p) => p.role === 'bot')

  // Track local muted state (bots where master toggled off)
  const [mutedBots, setMutedBots] = useState<Set<string>>(new Set())

  // Strategy dialog
  const [strategyDialog, setStrategyDialog] = useState<{ botId: string; botName: string } | null>(null)
  const [strategyText, setStrategyText] = useState('')

  // Speak dialog
  const [speakDialog, setSpeakDialog] = useState<{ botId: string; botName: string } | null>(null)
  const [speakPrompt, setSpeakPrompt] = useState('')

  const canAct = socketJoined && !!sessionId

  const toggleMute = (botId: string) => {
    setMutedBots((prev) => {
      const next = new Set(prev)
      if (next.has(botId)) {
        next.delete(botId)
      } else {
        next.add(botId)
        // Tell bot to be quiet via strategy override
        const socket = getSocket()
        socket?.emit('bot:change-strategy', {
          sessionId,
          botConfigId: botId,
          strategy: 'Молчи и не отвечай на сообщения, пока мастер не разрешит.',
        })
      }
      return next
    })
  }

  const unmute = (botId: string) => {
    setMutedBots((prev) => {
      const next = new Set(prev)
      next.delete(botId)
      return next
    })
    // Reset strategy
    const socket = getSocket()
    socket?.emit('bot:change-strategy', {
      sessionId,
      botConfigId: botId,
      strategy: '',
    })
  }

  const handleChangeStrategy = () => {
    if (!strategyDialog || !strategyText.trim() || !canAct) return
    const socket = getSocket()
    socket?.emit('bot:change-strategy', {
      sessionId,
      botConfigId: strategyDialog.botId,
      strategy: strategyText.trim(),
    })
    setStrategyDialog(null)
    setStrategyText('')
  }

  const handleSpeak = () => {
    if (!speakDialog || !canAct) return
    const socket = getSocket()
    socket?.emit('bot:speak', {
      sessionId,
      botConfigId: speakDialog.botId,
      prompt: speakPrompt.trim() || undefined,
    })
    setSpeakDialog(null)
    setSpeakPrompt('')
  }

  return (
    <>
      <Card className="bg-card border-border shadow-none h-full flex flex-col overflow-hidden p-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Управление ботами
        </span>
        <div className="flex-1 overflow-y-auto space-y-2">
          {bots.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">Нет ботов в сессии</div>
          )}
          {bots.map((bot) => {
            const botCfgId = bot.botConfigId || bot.id
            const isMuted = mutedBots.has(botCfgId)
            const name = bot.botName || 'Bot'
            return (
              <BotCard
                key={bot.id}
                name={name}
                specialistId={bot.botSpecialistId || ''}
                contributions={bot.contributionsCount}
                isOnline={bot.isOnline}
                isMuted={isMuted}
                canAct={canAct}
                onToggleMute={() => isMuted ? unmute(botCfgId) : toggleMute(botCfgId)}
                onChangeStrategy={() => {
                  setStrategyDialog({ botId: botCfgId, botName: name })
                  setStrategyText('')
                }}
                onSpeak={() => {
                  setSpeakDialog({ botId: botCfgId, botName: name })
                  setSpeakPrompt('')
                }}
              />
            )
          })}
        </div>
      </Card>

      {/* Strategy Dialog */}
      <Dialog open={!!strategyDialog} onOpenChange={(open) => !open && setStrategyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Стратегия: {strategyDialog?.botName}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Например: Будь более агрессивным критиком..."
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChangeStrategy()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStrategyDialog(null)}>Отмена</Button>
            <Button onClick={handleChangeStrategy} disabled={!strategyText.trim()}>Применить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Speak Dialog */}
      <Dialog open={!!speakDialog} onOpenChange={(open) => !open && setSpeakDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Попросить высказаться: {speakDialog?.botName}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Подсказка (необязательно)..."
            value={speakPrompt}
            onChange={(e) => setSpeakPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-2">
            Оставьте пустым -- бот выскажется по текущей теме
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSpeakDialog(null)}>Отмена</Button>
            <Button onClick={handleSpeak}>Высказаться</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function BotCard({
  name,
  specialistId,
  contributions,
  isOnline,
  isMuted,
  canAct,
  onToggleMute,
  onChangeStrategy,
  onSpeak,
}: {
  name: string
  specialistId: string
  contributions: number
  isOnline: boolean
  isMuted: boolean
  canAct: boolean
  onToggleMute: () => void
  onChangeStrategy: () => void
  onSpeak: () => void
}) {
  return (
    <div className={`p-2 rounded border border-border ${isMuted ? 'opacity-50' : 'bg-muted'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">{name}</span>
          {specialistId && (
            <Badge variant="outline" className="text-[9px]">{specialistId}</Badge>
          )}
          <Badge variant={isMuted ? 'danger' : isOnline ? 'success' : 'outline'} className="text-[9px]">
            {isMuted ? 'MUTE' : isOnline ? 'ON' : 'OFF'}
          </Badge>
        </div>
        <Switch
          checked={!isMuted}
          onCheckedChange={onToggleMute}
          disabled={!canAct}
        />
      </div>
      {!isMuted && (
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Сменить стратегию"
            disabled={!canAct}
            onClick={onChangeStrategy}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Попросить высказаться"
            disabled={!canAct}
            onClick={onSpeak}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Замолчать"
            disabled={!canAct}
            onClick={onToggleMute}
          >
            <Hand className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {contributions} msg
          </span>
        </div>
      )}
    </div>
  )
}
