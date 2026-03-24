import { Card, InputGroup, Button, Tag } from '@blueprintjs/core'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { clearEditingMessage } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { Markdown } from '@/components/Markdown'
import { MessageContextMenu } from '@/components/Chat/MessageContextMenu'
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu'

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
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">
          Чат сессии
          {!socketJoined && sessionId && (
            <span className="ml-2 text-odi-warning normal-case font-normal">подключение...</span>
          )}
        </span>
        <div className="flex gap-1">
          {(['all', 'players', 'bots', 'system'] as Filter[]).map((f) => (
            <Tag
              key={f}
              minimal
              interactive
              intent={filter === f ? 'primary' : 'none'}
              className="text-[10px] cursor-pointer"
              onClick={() => setFilter(f)}
            >
              {{ all: 'Все', players: 'Игроки', bots: 'Боты', system: 'Система' }[f]}
            </Tag>
          ))}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-1 mb-2">
        {filtered.length === 0 && (
          <div className="text-xs text-odi-text-muted text-center py-4">
            {sessionId ? 'Нет сообщений' : 'Выберите сессию'}
          </div>
        )}
        {filtered.map((msg) => {
          const bot = isBot(msg.role)
          const sys = isSystem(msg.role) || msg.text.startsWith('\u26A0')
          return (
            <div
              key={msg.id}
              className={`px-2 py-1 rounded text-xs ${
                sys
                  ? 'bg-odi-warning/10 text-odi-warning italic'
                  : bot
                    ? 'bg-odi-energy/10'
                    : 'bg-odi-surface-hover'
              }`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <span className="font-medium text-odi-text">
                {bot && !sys && '\u{1F916} '}{msg.author}
              </span>
              <span className="text-odi-text-muted ml-1">
                {formatTime(msg.timestamp)}
                {msg.isEdited && <span className="italic ml-1">(ред.)</span>}
              </span>
              <div className="text-odi-text mt-0.5 break-words">
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
            <div key={stream.streamId} className="px-2 py-1 rounded text-xs bg-odi-energy/10">
              <span className="font-medium text-odi-text">{'\u{1F916}'} {botName}</span>
              <div className="text-odi-text mt-0.5 break-words">
                <Markdown>{stream.text}</Markdown>
                <span className="inline-block w-1 h-3 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" />
              </div>
            </div>
          )
        })}
      </div>

      {editingMessage && (
        <div className="flex items-center gap-1 mb-1 px-1 text-[10px] text-odi-accent">
          <span>✏️ Редактирование</span>
          <button className="ml-auto text-odi-text-muted hover:text-odi-text" onClick={handleCancelEdit}>✕</button>
        </div>
      )}
      <div className="flex gap-1">
        <InputGroup
          inputRef={inputRef}
          placeholder={editingMessage ? 'Редактирование...' : socketJoined ? 'Сообщение от мастера...' : 'Не подключено'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          small
          disabled={!socketJoined || !sessionId}
          className={`flex-1 ${editingMessage ? '[&_input]:!border-odi-accent' : ''}`}
          leftIcon={editingMessage ? 'edit' : 'annotation'}
        />
        {editingMessage ? (
          <Button icon="tick" intent="success" small onClick={handleSend} disabled={!socketJoined || !sessionId || !input.trim()} />
        ) : (
          <Button icon="send-message" intent="primary" small disabled={!socketJoined || !sessionId || !input.trim()} onClick={handleSend} />
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
