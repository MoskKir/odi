import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { Markdown } from '@/components/Markdown'
import { MessageContextMenu } from '@/components/Chat/MessageContextMenu'
import { useMessageContextMenu } from '@/hooks/useMessageContextMenu'

export function TerminalView() {
  const messages = useAppSelector((s) => s.app.messages)
  const streamingMessages = useAppSelector((s) => s.app.streamingMessages)
  const streams = Object.values(streamingMessages)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const { contextMenu, handleContextMenu, closeContextMenu } = useMessageContextMenu()

  return (
    <div className="p-4 h-full overflow-y-auto font-mono text-sm">
      <div className="text-success mb-2">ODI Terminal v0.1 — Режим фокуса</div>
      <div className="border-b border-border mb-3 pb-1 text-muted-foreground">
        Введите команду или читайте лог сессии
      </div>
      {messages.map((msg) => {
        const isDeleted = msg.text.startsWith('\u26A0 Сообщение')

        if (isDeleted) {
          return (
            <div key={msg.id} className="mb-1 text-muted-foreground/40 italic">
              <span className="text-muted-foreground/30">[del]</span>{' '}
              <span>{msg.text.replace('\u26A0 ', '')}</span>
            </div>
          )
        }

        return (
          <div key={msg.id} className="mb-1" onContextMenu={(e) => handleContextMenu(e, msg)}>
            <span className="text-primary">[{msg.role}]</span>{' '}
            <span className="text-muted-foreground">{msg.author}:</span>{' '}
            <span className="text-foreground break-words"><Markdown>{msg.text}</Markdown></span>
            {msg.isEdited && <span className="text-muted-foreground text-[10px] ml-1 italic">(ред.)</span>}
          </div>
        )
      })}
      {streams.map((stream) => (
        <div key={stream.streamId} className="mb-1">
          <span className="text-primary">[{stream.botConfigId}]</span>{' '}
          <span className="text-muted-foreground">bot:</span>{' '}
          <span className="text-foreground break-words">
            {stream.ended ? <Markdown>{stream.text}</Markdown> : <span className="whitespace-pre-wrap">{stream.text}</span>}
            {!stream.ended && <span className="animate-pulse">▌</span>}
          </span>
        </div>
      ))}
      <div className="mt-3 text-success">
        {'>'} <span className="animate-pulse">_</span>
      </div>

      {contextMenu && sessionId && (
        <MessageContextMenu
          message={contextMenu.message}
          sessionId={sessionId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
