import { useRef, useEffect, useState, useCallback } from 'react'
import { Button, Icon } from '@blueprintjs/core'
import { useBotTestChat, type TestChatMessage } from '@/hooks/useBotTestChat'
import { Markdown } from '@/components/Markdown'

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
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on any change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-odi-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Icon icon="chat" size={14} className="text-odi-text-muted shrink-0" />
          <span className="text-sm font-medium text-odi-text truncate">Тест-чат</span>
          {connected
            ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Подключён" />
            : <span className="text-[10px] text-orange-400 shrink-0" title="Проверьте авторизацию (odi_token)">offline</span>
          }
        </div>
        <Button
          icon="trash"
          minimal
          small
          disabled={messages.length === 0 && !streaming && !waiting}
          onClick={clearMessages}
          title="Очистить чат"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && !streaming && !waiting && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-odi-text-muted">
            <Icon icon="chat" size={24} className="opacity-30" />
            <span className="text-xs text-center px-4">
              Напишите сообщение, чтобы протестировать бота с текущими настройками
            </span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} botName={botName} />
        ))}

        {/* Waiting indicator — sent message, waiting for stream to start */}
        {waiting && !streaming && (
          <div className="flex gap-2">
            <BotAvatar />
            <div className="min-w-0">
              <div className="text-[10px] text-odi-text-muted mb-1">{botName}</div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-odi-surface-hover">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        {/* Streaming — text arriving */}
        {streaming && (
          <div className="flex gap-2">
            <BotAvatar />
            <div className="min-w-0">
              <div className="text-[10px] text-odi-text-muted mb-1">{botName}</div>
              <div className="px-3 py-2 rounded-2xl rounded-bl-md text-sm leading-relaxed break-words bg-odi-surface-hover text-odi-text">
                {streaming.text
                  ? <><Markdown>{streaming.text}</Markdown><span className="inline-block w-1.5 h-4 ml-0.5 bg-odi-accent animate-pulse rounded-sm align-text-bottom" /></>
                  : <TypingDots />
                }
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <Icon icon="warning-sign" size={12} />
            <span className="break-all">{error}</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-odi-border px-3 py-2 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Написать сообщение...' : 'Нет подключения...'}
            disabled={!connected}
            rows={1}
            className="flex-1 resize-none bg-odi-bg text-odi-text border border-odi-border rounded-lg px-3 py-1.5 text-sm leading-relaxed focus:outline-none focus:border-odi-accent placeholder:text-odi-text-muted disabled:opacity-50"
          />
          <Button
            icon={isLoading ? 'stop' : 'send-message'}
            intent="primary"
            small
            disabled={(!text.trim() && !isLoading) || !connected}
            onClick={isLoading ? clearMessages : handleSend}
            title={isLoading ? 'Остановить' : 'Отправить'}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function BotAvatar() {
  return (
    <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-4">
      <Icon icon="cube" size={12} className="text-white" />
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-odi-text-muted animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-odi-text-muted animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-odi-text-muted animate-bounce [animation-delay:300ms]" />
    </span>
  )
}

function MessageBubble({ msg, botName }: { msg: TestChatMessage; botName: string }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isUser ? (
        <div className="shrink-0 w-6 h-6 rounded-full bg-odi-accent flex items-center justify-center mt-4">
          <Icon icon="person" size={12} className="text-white" />
        </div>
      ) : (
        <BotAvatar />
      )}
      <div className="min-w-0 max-w-[85%]">
        {!isUser && (
          <div className="text-[10px] text-odi-text-muted mb-1">{botName}</div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-odi-accent text-white rounded-br-md'
              : 'bg-odi-surface-hover text-odi-text rounded-bl-md'
          }`}
        >
          {isUser ? msg.content : <Markdown>{msg.content}</Markdown>}
        </div>
      </div>
    </div>
  )
}
