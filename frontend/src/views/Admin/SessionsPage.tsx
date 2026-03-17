import { useState } from 'react'
import { Card, Tag, Button, InputGroup, HTMLSelect, ProgressBar } from '@blueprintjs/core'

interface SessionRow {
  id: string
  title: string
  scenario: string
  host: string
  players: number
  status: 'active' | 'paused' | 'completed'
  startedAt: string
  duration: string
  progress: number
}

const MOCK_SESSIONS: SessionRow[] = [
  { id: '1', title: 'Стратегия развития 2026', scenario: 'Бизнес-стратегия', host: 'Анна К.', players: 4, status: 'active', startedAt: '17 мар 14:00', duration: '01:23', progress: 65 },
  { id: '2', title: 'Редизайн мобильного приложения', scenario: 'Креативный штурм', host: 'Борис М.', players: 3, status: 'active', startedAt: '17 мар 15:30', duration: '00:45', progress: 40 },
  { id: '3', title: 'Интеграция новой команды', scenario: 'Командообразование', host: 'Елена В.', players: 6, status: 'paused', startedAt: '16 мар 10:00', duration: '01:30', progress: 72 },
  { id: '4', title: 'Выход на азиатский рынок', scenario: 'Бизнес-стратегия', host: 'Дмитрий С.', players: 5, status: 'completed', startedAt: '15 мар 09:00', duration: '01:15', progress: 100 },
  { id: '5', title: 'Командный ретро Q1', scenario: 'Командообразование', host: 'Ирина П.', players: 8, status: 'completed', startedAt: '14 мар 16:00', duration: '00:55', progress: 100 },
]

const STATUS_MAP: Record<string, { label: string; intent: 'success' | 'warning' | 'primary' }> = {
  active: { label: 'Активна', intent: 'success' },
  paused: { label: 'Пауза', intent: 'warning' },
  completed: { label: 'Завершена', intent: 'primary' },
}

export function SessionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_SESSIONS.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeCnt = MOCK_SESSIONS.filter((s) => s.status === 'active').length
  const totalPlayers = MOCK_SESSIONS.filter((s) => s.status === 'active').reduce((a, s) => a + s.players, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Игровые сессии</h2>
        <div className="flex items-center gap-2">
          <Tag intent="success" minimal>{activeCnt} активных</Tag>
          <Tag minimal>{totalPlayers} игроков онлайн</Tag>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <InputGroup leftIcon="search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="!w-64" />
        <HTMLSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="paused">На паузе</option>
          <option value="completed">Завершённые</option>
        </HTMLSelect>
      </div>

      <div className="space-y-3">
        {filtered.map((session) => {
          const cfg = STATUS_MAP[session.status]
          return (
            <Card key={session.id} className="!bg-odi-surface !border-odi-border !shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-odi-text">{session.title}</span>
                    <Tag intent={cfg.intent} minimal round className="text-[10px]">{cfg.label}</Tag>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-odi-text-muted">
                    <span>{session.scenario}</span>
                    <span>Хост: {session.host}</span>
                    <span>{'\u{1F464}'} {session.players}</span>
                    <span>{session.startedAt}</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
                <div className="w-28 shrink-0">
                  <div className="flex justify-between text-xs text-odi-text-muted mb-1">
                    <span>Прогресс</span>
                    <span>{session.progress}%</span>
                  </div>
                  <ProgressBar value={session.progress / 100} intent={session.progress === 100 ? 'success' : 'primary'} stripes={false} animate={false} />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button icon="eye-open" minimal small title="Просмотр" />
                  {session.status === 'active' && <Button icon="pause" minimal small intent="warning" title="Пауза" />}
                  {session.status === 'paused' && <Button icon="play" minimal small intent="success" title="Продолжить" />}
                  <Button icon="cross" minimal small intent="danger" title="Завершить" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
