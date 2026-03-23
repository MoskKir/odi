import { useState, useCallback } from 'react'
import { Button, HTMLSelect } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { setQuickAddCard } from '@/store/appSlice'
import { FloatingWindow } from '@/components/FloatingWindow'
import { MarkdownTextArea } from '@/components/MarkdownTextArea'
import { getSocket } from '@/api/socket'
import { useSearchParams } from 'react-router-dom'

const COLUMNS = [
  { value: 'problems', label: 'Проблемы' },
  { value: 'solutions', label: 'Решения' },
  { value: 'creative', label: 'Креатив' },
]

export function QuickAddCard() {
  const isOpen = useAppSelector((s) => s.app.quickAddCard)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [column, setColumn] = useState('problems')
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
      icon="pin"
      initialWidth={460}
      initialHeight={320}
      minWidth={320}
      minHeight={240}
    >
      <div className="flex flex-col h-full p-4">
        <div className="mb-3 shrink-0">
          <HTMLSelect
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            fill
            className="!bg-odi-bg !text-odi-text"
          >
            {COLUMNS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </HTMLSelect>
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
          className="!bg-odi-bg !text-odi-text !border-odi-border flex-1 !resize-none"
        />
        <div className="flex justify-between items-center mt-3 shrink-0">
          <span className="text-xs text-odi-text-muted">Ctrl+Enter для отправки</span>
          <div className="flex gap-2">
            <Button text="Отмена" minimal onClick={handleClose} />
            <Button
              text="Добавить"
              intent="primary"
              disabled={!text.trim()}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </FloatingWindow>
  )
}
