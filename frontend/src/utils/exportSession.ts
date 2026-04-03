import type { ChatMessage, BoardCard } from '@/types'
import type { SessionBot, SessionParticipant } from '@/store/appSlice'

interface ExportData {
  title: string
  scenario: { title: string; subtitle: string } | null
  elapsed: string
  messages: ChatMessage[]
  cards: BoardCard[]
  bots: SessionBot[]
  participants: SessionParticipant[]
  boardColumns: { id: string; title: string }[] | null
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateMarkdown(data: ExportData): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${data.title}`)
  lines.push('')
  lines.push(`**Дата экспорта:** ${formatDate()}`)
  if (data.scenario) {
    lines.push(`**Сценарий:** ${data.scenario.title} — ${data.scenario.subtitle}`)
  }
  lines.push(`**Длительность:** ${data.elapsed}`)
  lines.push('')

  // Participants
  const humans = data.participants.filter((p) => p.role !== 'bot' && p.userName)
  const botParticipants = data.participants.filter((p) => p.role === 'bot' && p.botName)

  lines.push('## Участники')
  lines.push('')
  if (humans.length > 0) {
    lines.push('**Люди:**')
    humans.forEach((p) => lines.push(`- ${p.userName}`))
    lines.push('')
  }
  if (botParticipants.length > 0) {
    lines.push('**AI-боты:**')
    botParticipants.forEach((p) => {
      const bot = data.bots.find((b) => b.id === p.botConfigId)
      lines.push(`- ${p.botName}${bot ? ` — ${bot.description}` : ''}`)
    })
    lines.push('')
  }

  // Board cards
  const DEFAULT_COLUMNS = [
    { id: 'problems', title: 'Проблемы' },
    { id: 'solutions', title: 'Решения' },
    { id: 'creative', title: 'Креатив' },
  ]
  const columns = data.boardColumns ?? DEFAULT_COLUMNS

  if (data.cards.length > 0) {
    lines.push('## Доска')
    lines.push('')

    for (const col of columns) {
      const colCards = data.cards
        .filter((c) => c.column === col.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      if (colCards.length === 0) continue

      lines.push(`### ${col.title}`)
      lines.push('')
      colCards.forEach((card) => {
        const votes = card.votes > 0 ? ` (+${card.votes})` : ''
        lines.push(`- ${card.text}${votes} — *${card.author}*`)
      })
      lines.push('')
    }
  }

  // Chat messages
  if (data.messages.length > 0) {
    lines.push('## Ход дискуссии')
    lines.push('')

    for (const msg of data.messages) {
      if (msg.text.startsWith('\u26A0')) continue // skip deleted markers
      const time = formatTimestamp(msg.timestamp)
      const role = msg.role === 'bot' ? ' (AI)' : ''
      lines.push(`**[${time}] ${msg.author}${role}:**`)
      lines.push(msg.text)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push(`*Экспортировано из ODI Platform*`)

  return lines.join('\n')
}

export function downloadMarkdown(data: ExportData) {
  const md = generateMarkdown(data)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${data.title.replace(/[^\w\sа-яА-Я-]/g, '').trim() || 'session'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
