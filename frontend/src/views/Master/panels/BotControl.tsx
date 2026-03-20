import { Card, Button, Tag, Switch, InputGroup, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { getSocket } from '@/api/socket'

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
      <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider mb-2">
          Управление ботами
        </span>
        <div className="flex-1 overflow-y-auto space-y-2">
          {bots.length === 0 && (
            <div className="text-xs text-odi-text-muted text-center py-4">Нет ботов в сессии</div>
          )}
          {bots.map((bot) => {
            const botCfgId = bot.botConfigId || bot.id
            const isMuted = mutedBots.has(botCfgId)
            const name = bot.botName || 'Bot'
            return (
              <BotCard
                key={bot.id}
                participantId={bot.id}
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
      <Dialog
        isOpen={!!strategyDialog}
        onClose={() => setStrategyDialog(null)}
        title={`Стратегия: ${strategyDialog?.botName}`}
        className="bp5-dark"
      >
        <DialogBody>
          <InputGroup
            placeholder="Например: Будь более агрессивным критиком..."
            value={strategyText}
            onChange={(e) => setStrategyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChangeStrategy()}
            autoFocus
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Отмена" onClick={() => setStrategyDialog(null)} />
              <Button text="Применить" intent="primary" onClick={handleChangeStrategy} disabled={!strategyText.trim()} />
            </>
          }
        />
      </Dialog>

      {/* Speak Dialog */}
      <Dialog
        isOpen={!!speakDialog}
        onClose={() => setSpeakDialog(null)}
        title={`Попросить высказаться: ${speakDialog?.botName}`}
        className="bp5-dark"
      >
        <DialogBody>
          <InputGroup
            placeholder="Подсказка (необязательно)..."
            value={speakPrompt}
            onChange={(e) => setSpeakPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
            autoFocus
          />
          <p className="text-xs text-odi-text-muted mt-2">
            Оставьте пустым — бот выскажется по текущей теме
          </p>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Отмена" onClick={() => setSpeakDialog(null)} />
              <Button text="Высказаться" intent="primary" onClick={handleSpeak} />
            </>
          }
        />
      </Dialog>
    </>
  )
}

function BotCard({
  participantId,
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
  participantId: string
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
    <div className={`p-2 rounded border border-odi-border ${isMuted ? 'opacity-50' : 'bg-odi-surface-hover'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{'\u{1F916}'}</span>
          <span className="text-xs font-bold text-odi-text">{name}</span>
          {specialistId && (
            <Tag minimal className="text-[9px]">{specialistId}</Tag>
          )}
          <Tag minimal intent={isMuted ? 'danger' : isOnline ? 'success' : 'none'} className="text-[9px]">
            {isMuted ? 'MUTE' : isOnline ? 'ON' : 'OFF'}
          </Tag>
        </div>
        <Switch
          checked={!isMuted}
          onChange={onToggleMute}
          disabled={!canAct}
          className="!mb-0"
        />
      </div>
      {!isMuted && (
        <div className="flex items-center gap-2 mt-1">
          <Button
            icon="refresh"
            minimal
            small
            title="Сменить стратегию"
            disabled={!canAct}
            onClick={onChangeStrategy}
          />
          <Button
            icon="chat"
            minimal
            small
            title="Попросить высказаться"
            disabled={!canAct}
            onClick={onSpeak}
          />
          <Button
            icon="hand"
            minimal
            small
            title="Замолчать"
            disabled={!canAct}
            onClick={onToggleMute}
          />
          <span className="text-[10px] text-odi-text-muted ml-auto">
            {contributions} msg
          </span>
        </div>
      )}
    </div>
  )
}
