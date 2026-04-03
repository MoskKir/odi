import { useRef, useCallback, useState, useEffect } from 'react'
import { Mic, Paperclip, Square, Check, Send } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppSelector, useAppDispatch } from '@/store'
import { setInputBarHeight, syncPreferencesToServer, stopAllStreams, clearEditingMessage, clearPendingMention } from '@/store/appSlice'
import { getSocket } from '@/api/socket'

const MIN_HEIGHT = 36
const MAX_HEIGHT = 300

export function InputBar() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isResizing = useRef(false)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const socketJoined = useAppSelector((s) => s.app.socketJoined)
  const inputBarHeight = useAppSelector((s) => s.app.inputBarHeight)
  const dispatch = useAppDispatch()

  const sessionBots = useAppSelector((s) => s.app.sessionBots)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const editingMessage = useAppSelector((s) => s.app.editingMessage)
  const pendingMention = useAppSelector((s) => s.app.pendingMention)
  const isStreaming = Object.keys(streamingMessages).length > 0
  const canSend = socketJoined && !!sessionId

  // When editing starts, populate textarea
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text)
      textareaRef.current?.focus()
    }
  }, [editingMessage])

  // When a bot is clicked in the right panel, append @mention
  useEffect(() => {
    if (pendingMention) {
      setText((t) => `${t}@${pendingMention} `)
      dispatch(clearPendingMention())
      textareaRef.current?.focus()
    }
  }, [pendingMention, dispatch])

  const handleSend = () => {
    if (!text.trim() || !canSend) return
    const socket = getSocket()

    if (editingMessage) {
      if (text.trim() !== editingMessage.text) {
        socket?.emit('chat:edit', { sessionId, messageId: editingMessage.id, text: text.trim() })
      }
      dispatch(clearEditingMessage())
      setText('')
      return
    }

    socket?.emit('chat:send', { sessionId, text: text.trim() })
    setText('')
  }

  const handleCancelEdit = () => {
    dispatch(clearEditingMessage())
    setText('')
  }

  const handleStopStream = () => {
    // Immediately stop on frontend -- no lag
    dispatch(stopAllStreams())
    // Best-effort: tell backend to abort streams and block new ones
    if (sessionId) {
      const socket = getSocket()
      socket?.emit('chat:stop-stream', { sessionId })
    }
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

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true

    const startY = e.clientY
    const startHeight = inputBarHeight

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight - (ev.clientY - startY)))
      dispatch(setInputBarHeight(newHeight))
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dispatch(syncPreferencesToServer({ inputBarHeight: undefined }))
      // read actual value after state update
      setTimeout(() => {
        const el = document.querySelector('[data-input-bar]')
        if (el) {
          const ta = el.querySelector('textarea')
          if (ta) {
            dispatch(syncPreferencesToServer({ inputBarHeight: ta.offsetHeight }))
          }
        }
      }, 0)
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [inputBarHeight, dispatch])

  return (
    <div className="bg-card border-t border-border shrink-0" data-input-bar>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="h-1 cursor-row-resize hover:bg-border active:bg-muted-foreground transition-colors"
      />

      <div className="px-4 py-3">
        {editingMessage && (
          <div className="flex items-center gap-2 mb-2 px-1 text-xs text-primary">
            <span>Редактирование сообщения</span>
            <button
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={handleCancelEdit}
            >
              Отмена
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            placeholder={editingMessage ? 'Редактирование...' : 'Ввод мысли...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 resize-none bg-background text-foreground border rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground whitespace-pre-wrap overflow-y-auto ${
              editingMessage ? 'border-primary' : 'border-border focus:border-primary'
            }`}
            style={{ height: inputBarHeight }}
          />
          <Button variant="ghost" size="icon" title="Голос">
            <Mic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Файл">
            <Paperclip className="h-4 w-4" />
          </Button>
          {isStreaming ? (
            <Button variant="destructive" size="icon" onClick={handleStopStream} title="Остановить генерацию">
              <Square className="h-4 w-4" />
            </Button>
          ) : editingMessage ? (
            <Button
              size="icon"
              className="bg-success hover:bg-success/90"
              onClick={handleSend}
              disabled={!canSend}
              title="Сохранить"
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!canSend}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {sessionBots.map((bot) => (
            <Badge
              key={bot.id}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-[10px] px-1.5 py-0"
              onClick={() => setText((t) => `${t} @${bot.name} `)}
            >
              @{bot.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
