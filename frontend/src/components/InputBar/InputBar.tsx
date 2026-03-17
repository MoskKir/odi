import { useState } from 'react'
import { InputGroup, Button, ButtonGroup, Tag } from '@blueprintjs/core'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { getSocket } from '@/api/socket'

const BOT_TARGETS = [
  { role: 'moderator' as const, label: '@Модератор' },
  { role: 'critic' as const, label: '@Критик' },
  { role: 'visionary' as const, label: '@Визионер' },
]

export function InputBar() {
  const [text, setText] = useState('')
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const socketJoined = useAppSelector((s) => s.app.socketJoined)

  const canSend = socketJoined && !!sessionId

  const handleSend = () => {
    if (!text.trim() || !canSend) return
    const socket = getSocket()
    socket?.emit('chat:send', { sessionId, text: text.trim() })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-odi-surface border-t border-odi-border px-4 py-3 shrink-0">
      <div className="flex items-center gap-2">
        <InputGroup
          placeholder="Ввод мысли..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          leftIcon="edit"
          large
          className="flex-1"
        />
        <Button icon="microphone" minimal title="Голос" />
        <Button icon="paperclip" minimal title="Файл" />
        <Button icon="send-message" intent="primary" onClick={handleSend} disabled={!canSend} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <ButtonGroup minimal>
          {BOT_TARGETS.map(({ role, label }) => (
            <Tag
              key={role}
              interactive
              minimal
              intent="primary"
              className="cursor-pointer"
              onClick={() => setText((t) => `${t} ${label} `)}
            >
              {label}
            </Tag>
          ))}
        </ButtonGroup>
      </div>
    </div>
  )
}
