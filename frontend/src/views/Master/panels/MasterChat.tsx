import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trash2, StickyNote, Pencil, Send, Check, Bot } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { clearEditingMessage } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { Markdown } from '@/components/Markdown'
import { MessageContextMenu } from '@/components/Chat/MessageContextMenu'
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Filter = 'all' | 'players' | 'bots' | 'system'

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function MasterChat() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const socketJoined = useAppSelector((s) => s.app.socketJoined)
  const editingMessage = useAppSelector((s) => s.app.editingMessage)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { contextMenu, handleContextMenu, closeContextMenu } = useMessageContextMenu()

  // Populate input when editing starts
  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.text)
      inputRef.current?.focus()
    }
  }, [editingMessage])

  const streams = Object.values(streamingMessages)

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, streams])

  const handleSend = () => {
    if (!input.trim() || !socketJoined || !sessionId) return
    const socket = getSocket()

    if (editingMessage) {
      if (input.trim() !== editingMessage.text) {
        socket?.emit('chat:edit', { sessionId, messageId: editingMessage.id, text: input.trim() })
      }
      dispatch(clearEditingMessage())
      setInput('')
      return
    }

    socket?.emit('chat:send', { sessionId, text: input.trim() })
    setInput('')
  }

  const handleCancelEdit = () => {
    dispatch(clearEditingMessage())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && editingMessage) {
      handleCancelEdit()
    }
  }

  const isBot = (role: string) => role === 'bot'
  const isSystem = (role: string) => role === 'system'

  const filtered = messages.filter((msg) => {
    if (filter === 'all') return true
    if (filter === 'players') return !isBot(msg.role) && !isSystem(msg.role)
    if (filter === 'bots') return isBot(msg.role) && !isSystem(msg.role)
    if (filter === 'system') return isSystem(msg.role) || msg.text.startsWith('\u26A0')
    return true
  })

  return (
    <Card className="bg-card border-border shadow-none h-full flex flex-col overflow-hidden p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Чат сессии
          {!socketJoined && sessionId && (
            <span className="ml-2 text-warning normal-case font-normal">подключение...</span>
          )}
        </span>
        <div className="flex gap-1">
          {(['all', 'players', 'bots', 'system'] as Filter[]).map((f) => (
            <Badge
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              className="text-[10px] cursor-pointer"
              onClick={() => setFilter(f)}
            >
              {{ all: 'Все', players: 'Игроки', bots: 'Боты', system: 'Система' }[f]}
            </Badge>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-1 mb-2">
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            {sessionId ? 'Нет сообщений' : 'Выберите сессию'}
          </div>
        )}
        {filtered.map((msg) => {
          const bot = isBot(msg.role)
          const sys = isSystem(msg.role) || msg.text.startsWith('\u26A0')
          const isDeleted = msg.text.startsWith('\u26A0 Сообщение')

          if (isDeleted) {
            return (
              <div key={msg.id} className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-muted-foreground/50 italic">
                <Trash2 className="h-2.5 w-2.5" />
                <span>{msg.text.replace('\u26A0 ', '')}</span>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`px-2 py-1 rounded text-xs ${
                sys
                  ? 'bg-warning/10 text-warning italic'
                  : bot
                    ? 'bg-energy/10'
                    : 'bg-muted'
              }`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <span className="font-medium text-foreground">
                {bot && !sys && <Bot className="h-3 w-3 inline mr-0.5" />}{msg.author}
              </span>
              <span className="text-muted-foreground ml-1">
                {formatTime(msg.timestamp)}
                {msg.isEdited && <span className="italic ml-1">(ред.)</span>}
              </span>
              <div className="text-foreground mt-0.5 break-words">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          )
        })}
        {streams.map((stream) => {
          const bot = sessionBots.find(
            (b) => b.id === stream.botConfigId || b.specialistId === stream.botConfigId,
          )
          const botName = bot?.name || stream.botConfigId
          return (
            <div key={stream.streamId} className="px-2 py-1 rounded text-xs bg-energy/10">
              <span className="font-medium text-foreground"><Bot className="h-3 w-3 inline mr-0.5" /> {botName}</span>
              <div className="text-foreground mt-0.5 break-words">
                <Markdown>{stream.text}</Markdown>
                <span className="inline-block w-1 h-3 ml-0.5 bg-foreground animate-pulse rounded-sm align-text-bottom" />
              </div>
            </div>
          )
        })}
      </div>

      {editingMessage && (
        <div className="flex items-center gap-1 mb-1 px-1 text-[10px] text-primary">
          <span>Редактирование</span>
          <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={handleCancelEdit}>&times;</button>
        </div>
      )}
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {editingMessage
              ? <Pencil className="h-3.5 w-3.5" />
              : <StickyNote className="h-3.5 w-3.5" />
            }
          </div>
          <Input
            ref={inputRef}
            placeholder={editingMessage ? 'Редактирование...' : socketJoined ? 'Сообщение от мастера...' : 'Не подключено'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!socketJoined || !sessionId}
            className={`pl-8 h-8 text-sm ${editingMessage ? 'border-primary' : ''}`}
          />
        </div>
        {editingMessage ? (
          <Button size="sm" className="bg-success hover:bg-success/90 h-8" onClick={handleSend} disabled={!socketJoined || !sessionId || !input.trim()}>
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="h-8" disabled={!socketJoined || !sessionId || !input.trim()} onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {contextMenu && sessionId && (
        <MessageContextMenu
          message={contextMenu.message}
          sessionId={sessionId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </Card>
  )
}
