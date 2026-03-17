import { Card, InputGroup, Button, Tag } from '@blueprintjs/core'
import { useState } from 'react'

interface MasterMessage {
  id: string
  author: string
  isBot: boolean
  isSystem: boolean
  text: string
  time: string
}

const MOCK_MESSAGES: MasterMessage[] = [
  { id: '1', author: 'Система', isBot: false, isSystem: true, text: 'Фаза "Критический анализ" началась', time: '14:45' },
  { id: '2', author: 'Анна К.', isBot: false, isSystem: false, text: 'Давайте рассмотрим идею с велодорожками подробнее', time: '14:46' },
  { id: '3', author: 'Модератор', isBot: true, isSystem: false, text: 'Отличная идея, Анна. Критик, что думаешь о бюджете на это?', time: '14:46' },
  { id: '4', author: 'Критик', isBot: true, isSystem: false, text: 'Бюджет нереалистичен. Нужно минимум 50М, а у нас 20М.', time: '14:47' },
  { id: '5', author: 'Борис М.', isBot: false, isSystem: false, text: 'А если поэтапно? Первый этап — пилотная зона', time: '14:48' },
  { id: '6', author: 'Елена В.', isBot: false, isSystem: false, text: 'Согласна с Борисом, можно начать с центра', time: '14:48' },
  { id: '7', author: 'Модератор', isBot: true, isSystem: false, text: 'Хорошо, давайте проголосуем за поэтапный подход', time: '14:49' },
]

export function MasterChat() {
  const [messages] = useState(MOCK_MESSAGES)
  const [input, setInput] = useState('')

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none h-full flex flex-col overflow-hidden !p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider">Чат сессии</span>
        <div className="flex gap-1">
          <Tag minimal interactive className="text-[10px] cursor-pointer">Все</Tag>
          <Tag minimal interactive className="text-[10px] cursor-pointer">Игроки</Tag>
          <Tag minimal interactive className="text-[10px] cursor-pointer">Боты</Tag>
          <Tag minimal interactive intent="warning" className="text-[10px] cursor-pointer">Система</Tag>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 mb-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`px-2 py-1 rounded text-xs ${
            msg.isSystem
              ? 'bg-odi-warning/10 text-odi-warning italic'
              : msg.isBot
                ? 'bg-odi-energy/10'
                : 'bg-odi-surface-hover'
          }`}>
            <span className="font-medium text-odi-text">
              {msg.isBot && '\u{1F916} '}{msg.author}
            </span>
            <span className="text-odi-text-muted ml-1">{msg.time}</span>
            <div className="text-odi-text mt-0.5">{msg.text}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        <InputGroup
          placeholder="Сообщение от мастера..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          small
          className="flex-1"
          leftIcon="annotation"
        />
        <Button icon="send-message" intent="primary" small />
      </div>
    </Card>
  )
}
