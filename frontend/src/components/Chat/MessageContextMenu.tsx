import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/store'
import { getSocket } from '@/api/socket'
import type { ChatMessage } from '@/types'

interface Props {
  message: ChatMessage
  sessionId: string
  x: number
  y: number
  onClose: () => void
}

export function MessageContextMenu({ message, sessionId, x, y, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user)
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const menuRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  // Find participant that matches current user
  const myParticipant = participants.find((p) => p.userName === user?.name)
  const isMyMessage = myParticipant && message.participantId === myParticipant.id
  const isBotMessage = message.role === 'bot'
  const isAdmin = user?.role === 'admin'

  // User can edit/delete own messages; admin can also edit/delete bot messages
  const canEdit = isMyMessage || (isAdmin && isBotMessage)
  const canDelete = isMyMessage || (isAdmin && isBotMessage)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  // Adjust position so menu stays in viewport
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x
    const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y
    setPos({ x: nx, y: ny })
  }, [x, y])

  if (!canEdit && !canDelete) {
    return null
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editText.trim() || editText === message.text) {
      setEditing(false)
      return
    }
    const socket = getSocket()
    socket?.emit('chat:edit', { sessionId, messageId: message.id, text: editText.trim() })
    onClose()
  }

  const handleDelete = () => {
    const socket = getSocket()
    socket?.emit('chat:delete', { sessionId, messageId: message.id })
    onClose()
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-odi-surface border border-odi-border rounded-lg shadow-xl p-2 min-w-[250px]"
        style={{ left: pos.x, top: pos.y }}
      >
        <textarea
          className="w-full bg-odi-bg text-odi-text text-sm rounded p-2 border border-odi-border resize-none focus:outline-none focus:border-odi-accent"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleEditKeyDown}
          rows={3}
          autoFocus
        />
        <div className="flex justify-end gap-1 mt-1">
          <button
            className="px-2 py-1 text-xs rounded bg-odi-surface-hover text-odi-text-muted hover:text-odi-text"
            onClick={() => setEditing(false)}
          >
            Отмена
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-odi-accent text-white hover:opacity-90"
            onClick={handleSaveEdit}
          >
            Сохранить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-odi-surface border border-odi-border rounded-lg shadow-xl py-1 min-w-[140px]"
      style={{ left: pos.x, top: pos.y }}
    >
      {canEdit && (
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-odi-text hover:bg-odi-surface-hover flex items-center gap-2"
          onClick={handleEdit}
        >
          <span className="opacity-60">✏️</span> Редактировать
        </button>
      )}
      {canDelete && (
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-odi-surface-hover flex items-center gap-2"
          onClick={handleDelete}
        >
          <span className="opacity-60">🗑️</span> Удалить
        </button>
      )}
    </div>
  )
}
