import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@blueprintjs/core'
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

const ANIM_MS = 120

export function MessageContextMenu({ message, sessionId, x, y, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user)
  const participants = useAppSelector((s) => s.app.sessionParticipants)
  const dispatch = useAppDispatch()
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [phase, setPhase] = useState<'measuring' | 'in' | 'out'>('measuring')

  const myParticipant = participants.find((p) => p.userName === user?.name)
  const isMyMessage = myParticipant && message.participantId === myParticipant.id
  const isBotMessage = message.role === 'bot'
  const isAdmin = user?.role === 'admin'

  const canEdit = isMyMessage || (isAdmin && isBotMessage)
  const canDelete = isMyMessage || (isAdmin && isBotMessage)

  // Animated close: play exit animation, then unmount
  const animatedClose = useCallback(() => {
    if (phase === 'out') return
    setPhase('out')
    setTimeout(onClose, ANIM_MS)
  }, [onClose, phase])

  // Measure, clamp, reveal
  useLayoutEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x
    const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y
    setPos({ x: nx, y: ny })
    requestAnimationFrame(() => setPhase('in'))
  }, [x, y])

  // Outside click / Escape / scroll → animated close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        animatedClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') animatedClose()
    }
    const handleScroll = () => animatedClose()
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [animatedClose])

  if (!canEdit && !canDelete) {
    return null
  }

  const handleEdit = () => {
    dispatch(setEditingMessage({ id: message.id, text: message.text }))
    animatedClose()
  }

  const handleDelete = () => {
    const socket = getSocket()
    socket?.emit('chat:delete', { sessionId, messageId: message.id })
    animatedClose()
  }

  const isVisible = phase === 'in'

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos?.x ?? x,
        top: pos?.y ?? y,
        zIndex: 99999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.88)',
        transformOrigin: 'top left',
        transition: `opacity ${ANIM_MS}ms ease-out, transform ${ANIM_MS}ms ease-out`,
        visibility: phase === 'measuring' ? 'hidden' : 'visible',
      }}
    >
      <div className="bg-odi-surface border border-odi-border rounded-lg shadow-2xl py-1 min-w-[160px] overflow-hidden">
        {canEdit && (
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-odi-text hover:bg-odi-surface-hover transition-colors"
            onClick={handleEdit}
          >
            <Icon icon="edit" size={13} className="text-odi-text-muted" />
            Редактировать
          </button>
        )}
        {canDelete && (
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={handleDelete}
          >
            <Icon icon="trash" size={13} />
            Удалить
          </button>
        )}
      </div>
    </div>
  )

  return createPortal(menu, document.body)
}
