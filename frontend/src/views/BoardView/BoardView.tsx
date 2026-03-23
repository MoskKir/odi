import { useState, useCallback, useRef } from 'react'
import { Card, Tag, Button, Dialog, TextArea } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { setCards } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { useSearchParams } from 'react-router-dom'
import { ChatAvatar } from '@/components/ChatAvatar'
import { Markdown } from '@/components/Markdown'
import type { BoardCard } from '@/types'

const COLUMNS = [
  { id: 'problems', title: 'Проблемы', color: 'text-odi-danger', accent: 'border-t-red-500' },
  { id: 'solutions', title: 'Решения', color: 'text-odi-success', accent: 'border-t-green-500' },
  { id: 'creative', title: 'Креатив', color: 'text-odi-energy', accent: 'border-t-amber-500' },
]

interface CardDialogState {
  mode: 'add' | 'edit'
  column: string
  cardId?: string
  text: string
}

export function BoardView() {
  const cards = useAppSelector((s) => s.app.cards)
  const currentUser = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [dialog, setDialog] = useState<CardDialogState | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null)
  const dragCardRef = useRef<BoardCard | null>(null)

  const emit = useCallback((event: string, payload: Record<string, unknown>) => {
    const socket = getSocket()
    if (socket && sessionId) socket.emit(event, { sessionId, ...payload })
  }, [sessionId])

  const handleSubmit = useCallback(() => {
    if (!dialog || !dialog.text.trim()) return
    if (dialog.mode === 'add') {
      emit('board:add', { column: dialog.column, text: dialog.text.trim() })
    } else if (dialog.cardId) {
      emit('board:edit', { cardId: dialog.cardId, text: dialog.text.trim() })
    }
    setDialog(null)
  }, [dialog, emit])

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
    requestAnimationFrame(() => {
      ;(e.target as HTMLElement).style.opacity = '0.4'
    })
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    ;(e.target as HTMLElement).style.opacity = '1'
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

  const openAdd = (columnId: string) => setDialog({ mode: 'add', column: columnId, text: '' })
  const openEdit = (card: BoardCard) => setDialog({ mode: 'edit', column: card.column, cardId: card.id, text: card.text })
  const isOwner = (card: BoardCard) => currentUser?.name === card.author

  const dropIndicator = (
    <div className="h-0.5 bg-odi-accent rounded-full mx-1 my-0.5 transition-all" />
  )

  return (
    <>
      <div className="flex gap-4 p-4 h-full overflow-x-auto">
        {COLUMNS.map((col) => {
          const colCards = getColumnCards(col.id)
          const isDragOver = dragOverCol === col.id
          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[280px] flex flex-col gap-2 rounded-lg p-1 transition-colors duration-150 ${
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
                  <div key={card.id}>
                    {isDragOver && dropTargetIdx === index && dragCardRef.current?.id !== card.id && dropIndicator}
                    <Card
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, col.id, index)}
                      className={`!bg-odi-surface-hover !border-odi-border !shadow-none border-t-2 ${col.accent} group relative cursor-grab active:cursor-grabbing`}
                    >
                      {isOwner(card) && (
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
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
                      <div className="text-sm text-odi-text mb-3 leading-relaxed">
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
                    </Card>
                  </div>
                ))}
                {isDragOver && dropTargetIdx !== null && dropTargetIdx >= colCards.length && dropIndicator}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        isOpen={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit'
          ? 'Редактировать карточку'
          : `Новая карточка — ${COLUMNS.find((c) => c.id === dialog?.column)?.title || ''}`
        }
        className="!bg-odi-surface !text-odi-text"
      >
        <div className="p-4">
          <TextArea
            fill
            autoFocus
            rows={4}
            value={dialog?.text ?? ''}
            onChange={(e) => setDialog((d) => d ? { ...d, text: e.target.value } : d)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Поддерживается **markdown**..."
            className="!bg-odi-bg !text-odi-text !border-odi-border"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-odi-text-muted">Ctrl+Enter для отправки</span>
            <div className="flex gap-2">
              <Button text="Отмена" minimal onClick={() => setDialog(null)} />
              <Button
                text={dialog?.mode === 'edit' ? 'Сохранить' : 'Добавить'}
                intent="primary"
                disabled={!dialog?.text.trim()}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удалить карточку?"
        className="!bg-odi-surface !text-odi-text"
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
      </Dialog>
    </>
  )
}
