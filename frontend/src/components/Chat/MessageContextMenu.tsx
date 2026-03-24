import { useEffect, useRef, useState } from 'react'
import { Menu, MenuItem } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { setEditingMessage } from '@/store/appSlice'
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
  const dispatch = useAppDispatch()
  const menuRef = useRef<HTMLDivElement>(null)

  const myParticipant = participants.find((p) => p.userName === user?.name)
  const isMyMessage = myParticipant && message.participantId === myParticipant.id
  const isBotMessage = message.role === 'bot'
  const isAdmin = user?.role === 'admin'

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
    dispatch(setEditingMessage({ id: message.id, text: message.text }))
    onClose()
  }

  const handleDelete = () => {
    const socket = getSocket()
    socket?.emit('chat:delete', { sessionId, messageId: message.id })
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999]"
      style={{ left: pos.x, top: pos.y }}
    >
      <Menu className="!bg-odi-surface !border !border-odi-border !rounded-lg !shadow-xl !min-w-[160px]">
        {canEdit && (
          <MenuItem
            icon="edit"
            text="Редактировать"
            onClick={handleEdit}
            className="!text-xs"
          />
        )}
        {canDelete && (
          <MenuItem
            icon="trash"
            text="Удалить"
            intent="danger"
            onClick={handleDelete}
            className="!text-xs"
          />
        )}
      </Menu>
    </div>
  )
}
