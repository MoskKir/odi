import { useState, useCallback } from 'react'
import { Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useAppSelector, useAppDispatch } from '@/store'
import { setQuickAddCard } from '@/store/appSlice'
import { FloatingWindow } from '@/components/FloatingWindow'
import { MarkdownTextArea } from '@/components/MarkdownTextArea'
import { getSocket } from '@/api/socket'
import { useSearchParams } from 'react-router-dom'

const DEFAULT_COLUMNS = [
  { value: 'problems', label: 'Проблемы' },
  { value: 'solutions', label: 'Решения' },
  { value: 'creative', label: 'Креатив' },
]

export function QuickAddCard() {
  const isOpen = useAppSelector((s) => s.app.quickAddCard)
  const sessionBoardColumns = useAppSelector((s) => s.app.sessionBoardColumns)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const COLUMNS = sessionBoardColumns
    ? sessionBoardColumns.map((c) => ({ value: c.id, label: c.title }))
    : DEFAULT_COLUMNS

  const [column, setColumn] = useState(COLUMNS[0]?.value ?? 'problems')
  const [text, setText] = useState('')

  const handleClose = useCallback(() => {
    dispatch(setQuickAddCard(false))
    setText('')
  }, [dispatch])

  const handleSubmit = useCallback(() => {
    if (!text.trim() || !sessionId) return
    const socket = getSocket()
    if (socket) {
      socket.emit('board:add', { sessionId, column, text: text.trim() })
    }
    setText('')
    dispatch(setQuickAddCard(false))
  }, [text, column, sessionId, dispatch])

  return (
    <FloatingWindow
      isOpen={isOpen}
      onClose={handleClose}
      title="На доску"
      icon={Pin}
      initialWidth={460}
      initialHeight={320}
      minWidth={320}
      minHeight={240}
    >
      <div className="flex flex-col h-full p-4">
        <div className="mb-3 shrink-0">
          <Select value={column} onValueChange={setColumn}>
            <SelectTrigger className="w-full bg-background text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MarkdownTextArea
          fill
          autoFocus
          value={text}
          onValueChange={setText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Поддерживается **markdown**..."
          className="bg-background text-foreground border-border flex-1 !resize-none"
        />
        <div className="flex justify-between items-center mt-3 shrink-0">
          <span className="text-xs text-muted-foreground">Ctrl+Enter для отправки</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>Отмена</Button>
            <Button
              disabled={!text.trim()}
              onClick={handleSubmit}
            >
              Добавить
            </Button>
          </div>
        </div>
      </div>
    </FloatingWindow>
  )
}
