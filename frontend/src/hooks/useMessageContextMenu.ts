import { useState, useCallback } from 'react'
import type { ChatMessage } from '@/types'

type ContextMenuState = {
  message: ChatMessage
  x: number
  y: number
} | null

export function useMessageContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault()
    setContextMenu({ message, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  return { contextMenu, handleContextMenu, closeContextMenu }
}
