import { useState, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, ThumbsUp } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { setCards, setBoardColumnWidths, syncPreferencesToServer } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { useSearchParams } from 'react-router-dom'
import { ChatAvatar } from '@/components/ChatAvatar'
import { Markdown } from '@/components/Markdown'
import { FloatingWindow } from '@/components/FloatingWindow'
import { MarkdownTextArea } from '@/components/MarkdownTextArea'
import type { BoardCard } from '@/types'

const DEFAULT_COLUMNS = [
  { id: 'problems', title: 'Проблемы', color: 'text-destructive', accent: 'border-t-red-500' },
  { id: 'solutions', title: 'Решения', color: 'text-success', accent: 'border-t-green-500' },
  { id: 'creative', title: 'Креатив', color: 'text-energy', accent: 'border-t-amber-500' },
]

const COLUMN_STYLES = [
  { color: 'text-destructive', accent: 'border-t-red-500' },
  { color: 'text-success', accent: 'border-t-green-500' },
  { color: 'text-energy', accent: 'border-t-amber-500' },
  { color: 'text-foreground', accent: 'border-t-blue-500' },
  { color: 'text-muted-foreground', accent: 'border-t-violet-500' },
  { color: 'text-foreground', accent: 'border-t-cyan-500' },
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
  const sessionBoardColumns = useAppSelector((s) => s.app.sessionBoardColumns)
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

  // Use session-specific columns if available, otherwise defaults
  const COLUMNS = sessionBoardColumns
    ? sessionBoardColumns.map((col, i) => ({
        ...col,
        ...(COLUMN_STYLES[i % COLUMN_STYLES.length]),
      }))
    : DEFAULT_COLUMNS
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
    const cardEl = (e.currentTarget as HTMLElement).closest('[data-board-card]') as HTMLElement | null
    if (cardEl) requestAnimationFrame(() => { cardEl.style.opacity = '0.4' })
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const cardEl = (e.currentTarget as HTMLElement).closest('[data-board-card]') as HTMLElement | null
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
      if (card.column === targetColumn) {
        const currentIdx = colCards.findIndex((c) => c.id === card.id)
        orderIndex = dropTargetIdx > currentIdx ? dropTargetIdx - 1 : dropTargetIdx
      } else {
        orderIndex = dropTargetIdx
      }
    } else {
      orderIndex = colCards.length
    }

    if (card.column === targetColumn) {
      const currentIdx = colCards.findIndex((c) => c.id === card.id)
      if (currentIdx === orderIndex) {
        setDragOverCol(null)
        setDropTargetIdx(null)
        return
      }
    }

    const newCards = cards.filter((c) => c.id !== card.id)
    const targetCards = newCards
      .filter((c) => c.column === targetColumn)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    targetCards.splice(orderIndex, 0, { ...card, column: targetColumn })
    const reindexed = targetCards.map((c, i) => ({ ...c, orderIndex: i }))

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
    setEditors((prev) => {
      if (prev.some((e) => e.cardId === card.id)) return prev
      return [...prev, { key: `edit-${card.id}`, mode: 'edit', column: card.column, cardId: card.id, text: card.text }]
    })
  }
  const isOwner = (card: BoardCard) => currentUser?.name === card.author

  const dropIndicator = (
    <div className="h-0.5 bg-primary rounded-full mx-1 my-0.5 transition-all" />
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
                  isDragOver ? 'bg-accent' : ''
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
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">
                    {colCards.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => openAdd(col.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-1">
                {colCards.map((card, index) => (
                  <div
                    key={card.id}
                    onDragOver={(e) => handleCardDragOver(e, col.id, index)}
                  >
                    {isDragOver && dropTargetIdx === index && dragCardRef.current?.id !== card.id && dropIndicator}
                    <Card
                      data-board-card
                      className="bg-muted border-border shadow-none p-0 overflow-hidden group relative"
                    >
                      {/* Drag handle -- top bar */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          const cardEl = e.currentTarget.closest('[data-board-card]') as HTMLElement
                          if (cardEl) e.dataTransfer.setDragImage(cardEl, 20, 20)
                          handleDragStart(e, card)
                        }}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-center h-5 cursor-grab active:cursor-grabbing ${col.accent} bg-muted hover:bg-border/50 transition-colors border-t-2`}
                      >
                        <svg width="20" height="4" viewBox="0 0 20 4" className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" fill="currentColor">
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
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(card)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => setDeleteConfirm(card.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div className="text-sm text-foreground mb-3 leading-relaxed select-text">
                          <Markdown>{card.text}</Markdown>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ChatAvatar name={card.author} size="sm" />
                            <span className="text-xs text-muted-foreground">{card.author}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-muted-foreground hover:text-primary ${card.votes > 0 ? 'text-primary' : ''}`}
                            onClick={() => handleVote(card.id)}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
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
                <div className="w-0.5 bg-transparent group-hover/resize:bg-border group-active/resize:bg-muted-foreground transition-colors rounded-full" />
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
              className="!bg-background !text-foreground !border-border flex-1 !resize-none"
            />
            <div className="flex justify-between items-center mt-3 shrink-0">
              <span className="text-xs text-muted-foreground">Ctrl+Enter для отправки</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => closeEditor(editor.key)}>Отмена</Button>
                <Button
                  disabled={!editor.text.trim()}
                  onClick={() => handleSubmit(editor)}
                >
                  {editor.mode === 'edit' ? 'Сохранить' : 'Добавить'}
                </Button>
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
          <p className="text-sm text-muted-foreground mb-4">Это действие нельзя отменить.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Удалить
            </Button>
          </div>
        </div>
      </FloatingWindow>
    </>
  )
}
