import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, Icon, type IconName } from '@blueprintjs/core'

interface FloatingWindowProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: IconName
  children: ReactNode
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
  offsetIndex?: number
}

interface Position { x: number; y: number }
interface Size { w: number; h: number }

export function FloatingWindow({
  isOpen,
  onClose,
  title,
  icon,
  children,
  initialWidth = 420,
  initialHeight = 320,
  minWidth = 280,
  minHeight = 200,
  offsetIndex = 0,
}: FloatingWindowProps) {
  const [pos, setPos] = useState<Position | null>(null)
  const [size, setSize] = useState<Size>({ w: initialWidth, h: initialHeight })
  const windowRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef<string | null>(null)

  // Center on first open, cascade multiple windows
  useEffect(() => {
    if (isOpen && !pos) {
      const offset = offsetIndex * 30
      setPos({
        x: Math.max(0, (window.innerWidth - size.w) / 2 + offset),
        y: Math.max(0, (window.innerHeight - size.h) / 3 + offset),
      })
    }
    if (!isOpen) setPos(null)
  }, [isOpen])

  // Title bar drag
  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    isDragging.current = true

    const startX = e.clientX
    const startY = e.clientY
    const startPos = pos ?? { x: 0, y: 0 }

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, startPos.x + ev.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 40, startPos.y + ev.clientY - startY)),
      })
    }

    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'move'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos])

  // Resize from edges/corners
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = edge

    const startX = e.clientX
    const startY = e.clientY
    const startSize = { ...size }
    const startPos = pos ?? { x: 0, y: 0 }

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const newSize = { ...startSize }
      const newPos = { ...startPos }

      if (edge.includes('e')) newSize.w = Math.max(minWidth, startSize.w + dx)
      if (edge.includes('s')) newSize.h = Math.max(minHeight, startSize.h + dy)
      if (edge.includes('w')) {
        const dw = Math.min(dx, startSize.w - minWidth)
        newSize.w = startSize.w - dw
        newPos.x = startPos.x + dw
      }
      if (edge.includes('n')) {
        const dh = Math.min(dy, startSize.h - minHeight)
        newSize.h = startSize.h - dh
        newPos.y = startPos.y + dh
      }

      setSize(newSize)
      setPos(newPos)
    }

    const onUp = () => {
      isResizing.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [pos, size, minWidth, minHeight])

  // Bring to front on click
  const handleFocus = useCallback(() => {
    if (windowRef.current) {
      const windows = document.querySelectorAll('[data-floating-window]')
      let maxZ = 1000
      windows.forEach((w) => {
        const z = parseInt(getComputedStyle(w).zIndex || '0', 10)
        if (z > maxZ) maxZ = z
      })
      windowRef.current.style.zIndex = String(maxZ + 1)
    }
  }, [])

  if (!isOpen || !pos) return null

  const resizeEdges = [
    { edge: 'n', className: 'top-0 left-2 right-2 h-1 cursor-n-resize' },
    { edge: 's', className: 'bottom-0 left-2 right-2 h-1 cursor-s-resize' },
    { edge: 'w', className: 'top-2 bottom-2 left-0 w-1 cursor-w-resize' },
    { edge: 'e', className: 'top-2 bottom-2 right-0 w-1 cursor-e-resize' },
    { edge: 'nw', className: 'top-0 left-0 w-2 h-2 cursor-nw-resize' },
    { edge: 'ne', className: 'top-0 right-0 w-2 h-2 cursor-ne-resize' },
    { edge: 'sw', className: 'bottom-0 left-0 w-2 h-2 cursor-sw-resize' },
    { edge: 'se', className: 'bottom-0 right-0 w-2 h-2 cursor-se-resize' },
  ]

  return createPortal(
    <div
      ref={windowRef}
      data-floating-window
      className="fixed flex flex-col bg-odi-surface border border-odi-border rounded-lg shadow-2xl overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: 1000 }}
      onMouseDown={handleFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        className="flex items-center gap-2 px-3 py-2 bg-odi-surface-hover border-b border-odi-border shrink-0 cursor-move select-none"
      >
        {icon && <Icon icon={icon} size={14} className="text-odi-text-muted shrink-0" />}
        <span className="text-sm font-medium text-odi-text truncate flex-1">{title}</span>
        <Button
          icon="cross"
          minimal
          small
          className="!text-odi-text-muted hover:!text-odi-text shrink-0"
          onClick={onClose}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {children}
      </div>

      {/* Resize handles */}
      {resizeEdges.map(({ edge, className }) => (
        <div
          key={edge}
          onMouseDown={(e) => handleResizeMouseDown(e, edge)}
          className={`absolute ${className}`}
        />
      ))}
    </div>,
    document.body,
  )
}
