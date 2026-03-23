import { useState, useCallback, useRef } from 'react'
import { Card, Tag, Button } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { setCards, setBoardColumnWidths, syncPreferencesToServer } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { useSearchParams } from 'react-router-dom'
import { ChatAvatar } from '@/components/ChatAvatar'
import { Markdown } from '@/components/Markdown'
import { FloatingWindow } from '@/components/FloatingWindow'
import { MarkdownTextArea } from '@/components/MarkdownTextArea'
import type { BoardCard } from '@/types'

const COLUMNS = [
  { id: 'problems', title: 'Проблемы', color: 'text-odi-danger', accent: 'border-t-red-500' },
  { id: 'solutions', title: 'Решения', color: 'text-odi-success', accent: 'border-t-green-500' },
  { id: 'creative', title: 'Креатив', color: 'text-odi-energy', accent: 'border-t-amber-500' },
]

interface CardEditor {
  key: string
  mode: 'add' | 'edit'
  column: string
  cardId?: string
  text: string
}

let editorKeyCounter = 0

export function BoardView() {
  const cards = useAppSelector((s) => s.app.cards)
  const currentUser = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [editors, setEditors] = useState<CardEditor[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null)
  const dragCardRef = useRef<BoardCard | null>(null)
  const colWidths = useAppSelector((s) => s.app.boardColumnWidths)
  const resizingRef = useRef(false)
  const boardRef = useRef<HTMLDivElement>(null)

  const emit = useCallback((event: string, payload: Record<string, unknown>) => {
    const socket = getSocket()
    if (socket && sessionId) socket.emit(event, { sessionId, ...payload })
  }, [sessionId])

  const handleSubmit = useCallback((editor: CardEditor) => {
    if (!editor.text.trim()) return
    if (editor.mode === 'add') {
      emit('board:add', { column: editor.column, text: editor.text.trim() })
    } else if (editor.cardId) {
      emit('board:edit', { cardId: editor.cardId, text: editor.text.trim() })
    }
    setEditors((prev) => prev.filter((e) => e.key !== editor.key))
  }, [emit])

  const closeEditor = useCallback((key: string) => {
    setEditors((prev) => prev.filter((e) => e.key !== key))
  }, [])

  const updateEditorText = useCallback((key: string, text: string) => {
    setEditors((prev) => prev.map((e) => e.key === key ? { ...e, text } : e))
  }, [])

  const handleDelete = useCallback((cardId: string) => {
    emit('board:delete', { cardId })
    setDeleteConfirm(null)
  }, [emit])

  const handleVote = useCallback((cardId: string) => {
    emit('board:vote', { cardId })
  }, [emit])

  const getColumnCards = useCallback((columnId: string) => {
    return cards
      .filter((c) => c.column === columnId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [cards])

  // --- Drag and drop ---

  const handleDragStart = useCallback((e: React.DragEvent, card: BoardCard) => {
    dragCardRef.current = card
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', card.id)
    const cardEl = (e.currentTarget as HTMLElement).closest('.bp5-card') as HTMLElement | null
    if (cardEl) requestAnimationFrame(() => { cardEl.style.opacity = '0.4' })
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const cardEl = (e.currentTarget as HTMLElement).closest('.bp5-card') as HTMLElement | null
    if (cardEl) cardEl.style.opacity = '1'
    dragCardRef.current = null
    setDragOverCol(null)
    setDropTargetIdx(null)
  }, [])

  const handleColumnDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(columnId)
  }, [])

  const handleColumnDragLeave = useCallback((e: React.DragEvent, columnId: string) => {
    const related = e.relatedTarget as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    if (!related || !current.contains(related)) {
      setDragOverCol((prev) => prev === columnId ? null : prev)
      setDropTargetIdx(null)
    }
  }, [])

  const handleCardDragOver = useCallback((e: React.DragEvent, columnId: string, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const insertAt = e.clientY < midY ? index : index + 1
    setDragOverCol(columnId)
    setDropTargetIdx(insertAt)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    const card = dragCardRef.current
    if (!card) return

    const colCards = getColumnCards(targetColumn)
    let orderIndex: number

    if (dropTargetIdx !== null) {
      // Dropping between cards — adjust for same-column removal
      if (card.column === targetColumn) {
        const currentIdx = colCards.findIndex((c) => c.id === card.id)
        orderIndex = dropTargetIdx > currentIdx ? dropTargetIdx - 1 : dropTargetIdx
      } else {
        orderIndex = dropTargetIdx
      }
    } else {
      // Dropping on empty area — append to end
      orderIndex = colCards.length
    }

    // Skip if no actual change
    if (card.column === targetColumn) {
      const currentIdx = colCards.findIndex((c) => c.id === card.id)
      if (currentIdx === orderIndex) {
        setDragOverCol(null)
        setDropTargetIdx(null)
        return
      }
    }

    // Optimistic update
    const newCards = cards.filter((c) => c.id !== card.id)
    const targetCards = newCards
      .filter((c) => c.column === targetColumn)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    targetCards.splice(orderIndex, 0, { ...card, column: targetColumn })
    const reindexed = targetCards.map((c, i) => ({ ...c, orderIndex: i }))

    // If moving between columns, also reindex old column
    let otherCards = newCards.filter((c) => c.column !== targetColumn)
    if (card.column !== targetColumn) {
      const oldColCards = otherCards
        .filter((c) => c.column === card.column)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((c, i) => ({ ...c, orderIndex: i }))
      otherCards = [
        ...otherCards.filter((c) => c.column !== card.column),
        ...oldColCards,
      ]
    }

    dispatch(setCards([...otherCards, ...reindexed]))
    emit('board:move', { cardId: card.id, column: targetColumn, orderIndex })

    setDragOverCol(null)
    setDropTargetIdx(null)
  }, [cards, dropTargetIdx, getColumnCards, dispatch, emit])

  // Initialize pixel widths from actual rendered sizes on first interaction
  const ensurePixelWidths = useCallback(() => {
    if (colWidths) return colWidths
    const container = boardRef.current
    if (!container) return null
    const colEls = container.querySelectorAll<HTMLElement>('[data-board-col]')
    const widths = COLUMNS.map((_, i) => colEls[i]?.offsetWidth ?? 300)
    dispatch(setBoardColumnWidths(widths))
    return widths
  }, [colWidths, dispatch])

  const handleResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX

    const widths = ensurePixelWidths()
    if (!widths) return
    const startLeft = widths[colIndex]

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const dx = ev.clientX - startX
      const newLeft = Math.max(200, startLeft + dx)
      const next = [...(colWidths ?? widths)]
      next[colIndex] = newLeft
      dispatch(setBoardColumnWidths(next))
    }

    const onMouseUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Sync to server after resize ends
      dispatch(syncPreferencesToServer({ boardColumnWidths: colWidths }))
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [ensurePixelWidths, colWidths, dispatch])

  const openAdd = (columnId: string) => {
    setEditors((prev) => [...prev, { key: `new-${++editorKeyCounter}`, mode: 'add', column: columnId, text: '' }])
  }
  const openEdit = (card: BoardCard) => {
    // Don't open duplicate editor for same card
    setEditors((prev) => {
      if (prev.some((e) => e.cardId === card.id)) return prev
      return [...prev, { key: `edit-${card.id}`, mode: 'edit', column: card.column, cardId: card.id, text: card.text }]
    })
  }
  const isOwner = (card: BoardCard) => currentUser?.name === card.author

  const dropIndicator = (
    <div className="h-0.5 bg-odi-accent rounded-full mx-1 my-0.5 transition-all" />
  )

  return (
    <>
      <div ref={boardRef} className="flex p-4 h-full overflow-x-auto" data-board-columns>
        {COLUMNS.map((col, colIndex) => {
          const colCards = getColumnCards(col.id)
          const isDragOver = dragOverCol === col.id
          const w = colWidths?.[colIndex]
          return (
            <div
              key={col.id}
              className="flex shrink-0"
              style={w ? { width: w } : { flex: 1, minWidth: 280 }}
            >
              <div
                data-board-col
                className={`flex-1 min-w-0 flex flex-col gap-2 rounded-lg p-1 transition-colors duration-150 ${
                  isDragOver ? 'bg-odi-accent/10' : ''
                }`}
                onDragOver={(e) => handleColumnDragOver(e, col.id)}
                onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </span>
                  <Tag minimal round className="!text-odi-text-muted !text-[10px]">
                    {colCards.length}
                  </Tag>
                </div>
                <Button
                  icon="plus"
                  minimal
                  small
                  className="!text-odi-text-muted hover:!text-odi-text"
                  onClick={() => openAdd(col.id)}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-1">
                {colCards.map((card, index) => (
                  <div
                    key={card.id}
                    onDragOver={(e) => handleCardDragOver(e, col.id, index)}
                  >
                    {isDragOver && dropTargetIdx === index && dragCardRef.current?.id !== card.id && dropIndicator}
                    <Card
                      className={`!bg-odi-surface-hover !border-odi-border !shadow-none !p-0 overflow-hidden group relative`}
                    >
                      {/* Drag handle — top bar */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          const cardEl = e.currentTarget.closest('.bp5-card') as HTMLElement
                          if (cardEl) e.dataTransfer.setDragImage(cardEl, 20, 20)
                          handleDragStart(e, card)
                        }}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-center h-5 cursor-grab active:cursor-grabbing ${col.accent} bg-odi-surface-hover hover:bg-odi-border/50 transition-colors border-t-2`}
                      >
                        <svg width="20" height="4" viewBox="0 0 20 4" className="text-odi-text-muted/40 group-hover:text-odi-text-muted transition-colors" fill="currentColor">
                          <circle cx="4" cy="2" r="1" />
                          <circle cx="8" cy="2" r="1" />
                          <circle cx="12" cy="2" r="1" />
                          <circle cx="16" cy="2" r="1" />
                        </svg>
                      </div>
                      {/* Card content */}
                      <div className="px-3 py-2">
                        {isOwner(card) && (
                          <div className="absolute top-6 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            <Button
                              icon="edit"
                              minimal
                              small
                              className="!text-odi-text-muted hover:!text-odi-accent !h-6 !min-h-0 !min-w-0 !w-6 !p-0"
                              onClick={() => openEdit(card)}
                            />
                            <Button
                              icon="trash"
                              minimal
                              small
                              className="!text-odi-text-muted hover:!text-red-500 !h-6 !min-h-0 !min-w-0 !w-6 !p-0"
                              onClick={() => setDeleteConfirm(card.id)}
                            />
                          </div>
                        )}
                        <div className="text-sm text-odi-text mb-3 leading-relaxed select-text">
                          <Markdown>{card.text}</Markdown>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ChatAvatar name={card.author} size="sm" />
                            <span className="text-xs text-odi-text-muted">{card.author}</span>
                          </div>
                          <Button
                            icon="thumbs-up"
                            minimal
                            small
                            className={`!text-odi-text-muted hover:!text-odi-accent ${card.votes > 0 ? '!text-odi-accent' : ''}`}
                            onClick={() => handleVote(card.id)}
                          >
                            {card.votes > 0 ? card.votes : ''}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
                {isDragOver && dropTargetIdx !== null && dropTargetIdx >= colCards.length && dropIndicator}
              </div>
              </div>
              {/* Resize handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, colIndex)}
                className="shrink-0 w-2 cursor-col-resize group/resize flex items-stretch justify-center"
              >
                <div className="w-0.5 bg-transparent group-hover/resize:bg-odi-accent/40 group-active/resize:bg-odi-accent/60 transition-colors rounded-full" />
              </div>
            </div>
          )
        })}
        {/* Trailing space for scrolling past last column */}
        <div className="shrink-0 w-16" />
      </div>

      {/* Editor floating windows */}
      {editors.map((editor, i) => (
        <FloatingWindow
          key={editor.key}
          isOpen
          onClose={() => closeEditor(editor.key)}
          title={editor.mode === 'edit'
            ? 'Редактировать карточку'
            : `Новая карточка — ${COLUMNS.find((c) => c.id === editor.column)?.title || ''}`
          }
          icon={editor.mode === 'edit' ? 'edit' : 'plus'}
          initialWidth={460}
          initialHeight={300}
          minWidth={320}
          minHeight={220}
          offsetIndex={i}
        >
          <div className="flex flex-col h-full p-4">
            <MarkdownTextArea
              fill
              autoFocus
              value={editor.text}
              onValueChange={(v) => updateEditorText(editor.key, v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleSubmit(editor)
                }
              }}
              placeholder="Поддерживается **markdown**..."
              className="!bg-odi-bg !text-odi-text !border-odi-border flex-1 !resize-none"
            />
            <div className="flex justify-between items-center mt-3 shrink-0">
              <span className="text-xs text-odi-text-muted">Ctrl+Enter для отправки</span>
              <div className="flex gap-2">
                <Button text="Отмена" minimal onClick={() => closeEditor(editor.key)} />
                <Button
                  text={editor.mode === 'edit' ? 'Сохранить' : 'Добавить'}
                  intent="primary"
                  disabled={!editor.text.trim()}
                  onClick={() => handleSubmit(editor)}
                />
              </div>
            </div>
          </div>
        </FloatingWindow>
      ))}

      {/* Delete confirmation */}
      <FloatingWindow
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удалить карточку?"
        icon="trash"
        initialWidth={340}
        initialHeight={160}
        minWidth={280}
        minHeight={140}
      >
        <div className="p-4">
          <p className="text-sm text-odi-text-muted mb-4">Это действие нельзя отменить.</p>
          <div className="flex justify-end gap-2">
            <Button text="Отмена" minimal onClick={() => setDeleteConfirm(null)} />
            <Button
              text="Удалить"
              intent="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            />
          </div>
        </div>
      </FloatingWindow>
    </>
  )
}
