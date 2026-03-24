import { useRef, useCallback, useState, useEffect } from 'react'
import { Button, ButtonGroup, Tag } from '@blueprintjs/core'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setInputBarHeight, syncPreferencesToServer, stopAllStreams, clearEditingMessage } from '@/store/appSlice'
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
  const isStreaming = Object.keys(streamingMessages).length > 0
  const canSend = socketJoined && !!sessionId

  // When editing starts, populate textarea
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text)
      textareaRef.current?.focus()
    }
  }, [editingMessage])

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
    // Immediately stop on frontend — no lag
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
    <div className="bg-odi-surface border-t border-odi-border shrink-0" data-input-bar>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="h-1 cursor-row-resize hover:bg-odi-accent/40 active:bg-odi-accent/60 transition-colors"
      />

      <div className="px-4 py-3">
        {editingMessage && (
          <div className="flex items-center gap-2 mb-2 px-1 text-xs text-odi-accent">
            <span>✏️ Редактирование сообщения</span>
            <button
              className="ml-auto text-odi-text-muted hover:text-odi-text"
              onClick={handleCancelEdit}
            >
              ✕ Отмена
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
            className={`flex-1 resize-none bg-odi-bg text-odi-text border rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none placeholder:text-odi-text-muted whitespace-pre-wrap overflow-y-auto ${
              editingMessage ? 'border-odi-accent' : 'border-odi-border focus:border-odi-accent'
            }`}
            style={{ height: inputBarHeight }}
          />
          <Button icon="microphone" minimal title="Голос" />
          <Button icon="paperclip" minimal title="Файл" />
          {isStreaming ? (
            <Button icon="stop" intent="danger" onClick={handleStopStream} title="Остановить генерацию" />
          ) : editingMessage ? (
            <Button icon="tick" intent="success" onClick={handleSend} disabled={!canSend} title="Сохранить" />
          ) : (
            <Button icon="send-message" intent="primary" onClick={handleSend} disabled={!canSend} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <ButtonGroup minimal>
            {sessionBots.map((bot) => (
              <Tag
                key={bot.id}
                interactive
                minimal
                intent="primary"
                className="cursor-pointer"
                onClick={() => setText((t) => `${t} @${bot.name} `)}
              >
                @{bot.name}
              </Tag>
            ))}
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}
