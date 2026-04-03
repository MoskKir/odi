import { useRef, useEffect, useState, useCallback } from 'react'
import { MessageSquare, Trash2, AlertTriangle, Send, Square } from 'lucide-react'
import { useBotTestChat, type TestChatMessage } from '@/hooks/useBotTestChat'
import { Markdown } from '@/components/Markdown'
import { ChatAvatar } from '@/components/ChatAvatar'
import { Button } from '@/components/ui/button'

interface BotTestChatProps {
  botId: string
  botName: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
}

export function BotTestChat({ botId, botName, systemPrompt, model, temperature, maxTokens }: BotTestChatProps) {
  const {
    messages,
    streaming,
    waiting,
    connected,
    error,
    isLoading,
    sendMessage,
    clearMessages,
  } = useBotTestChat({ botId, systemPrompt, model, temperature, maxTokens })

  const [text, setText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll within the messages container only
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streaming, waiting])

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return
    sendMessage(text.trim())
    setText('')
    // re-focus after React re-render
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [text, isLoading, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">Тест-чат</span>
          {connected
            ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Подключён" />
            : <span className="text-[10px] text-orange-400 shrink-0" title="Проверьте авторизацию (odi_token)">offline</span>
          }
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={messages.length === 0 && !streaming && !waiting}
          onClick={clearMessages}
          title="Очистить чат"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && !streaming && !waiting && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-30" />
            <span className="text-xs text-center px-4">
              Напишите сообщение, чтобы протестировать бота с текущими настройками
            </span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} botName={botName} />
        ))}

        {/* Waiting indicator -- sent message, waiting for stream to start */}
        {waiting && !streaming && (
          <div className="flex gap-2">
            <ChatAvatar name={botName} size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground mb-1">{botName}</div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-muted">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        {/* Streaming -- text arriving */}
        {streaming && (
          <div className="flex gap-2">
            <ChatAvatar name={botName} size="sm" />
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground mb-1">{botName}</div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words bg-muted text-foreground">
                {streaming.text
                  ? <><Markdown>{streaming.text}</Markdown><span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse rounded-sm align-text-bottom" /></>
                  : <TypingDots />
                }
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span className="break-all">{error}</span>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Написать сообщение...' : 'Нет подключения...'}
            disabled={!connected}
            rows={1}
            className="flex-1 resize-none bg-background text-foreground border border-border rounded-lg px-3 py-1.5 text-sm leading-relaxed focus:outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            size="sm"
            disabled={(!text.trim() && !isLoading) || !connected}
            onClick={isLoading ? clearMessages : handleSend}
            title={isLoading ? 'Остановить' : 'Отправить'}
          >
            {isLoading ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -- Sub-components -- */

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
    </span>
  )
}

function MessageBubble({ msg, botName }: { msg: TestChatMessage; botName: string }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <ChatAvatar name={isUser ? 'Вы' : botName} isMine={isUser} size="sm" />
      <div className="min-w-0 max-w-[85%]">
        {!isUser && (
          <div className="text-[10px] text-muted-foreground mb-1">{botName}</div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          }`}
        >
          <Markdown>{msg.content}</Markdown>
        </div>
      </div>
    </div>
  )
}
