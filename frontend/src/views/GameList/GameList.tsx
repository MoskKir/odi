import { Button, Card, Tag, ProgressBar, NonIdealState, InputGroup } from '@blueprintjs/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import type { GameListItem, GameStatus } from '@/types'

const STATUS_CONFIG: Record<GameStatus, { label: string; intent: 'success' | 'warning' | 'primary' | 'none' }> = {
  active: { label: 'Активна', intent: 'success' },
  paused: { label: 'Пауза', intent: 'warning' },
  completed: { label: 'Завершена', intent: 'primary' },
  draft: { label: 'Черновик', intent: 'none' },
}

const MOCK_GAMES: GameListItem[] = [
  {
    id: '1',
    title: 'Стратегия развития 2026',
    scenario: 'Бизнес-стратегия',
    status: 'active',
    crewSize: 4,
    date: '17 мар 2026',
    duration: '01:23:45',
    progress: 65,
  },
  {
    id: '2',
    title: 'Редизайн мобильного приложения',
    scenario: 'Креативный штурм',
    status: 'paused',
    crewSize: 3,
    date: '15 мар 2026',
    duration: '00:45:12',
    progress: 40,
  },
  {
    id: '3',
    title: 'Интеграция новой команды',
    scenario: 'Командообразование',
    status: 'completed',
    crewSize: 6,
    date: '10 мар 2026',
    duration: '01:30:00',
    progress: 100,
  },
  {
    id: '4',
    title: 'Выход на азиатский рынок',
    scenario: 'Бизнес-стратегия',
    status: 'completed',
    crewSize: 5,
    date: '5 мар 2026',
    duration: '01:15:30',
    progress: 100,
  },
  {
    id: '5',
    title: 'Хакатон: AI-ассистент',
    scenario: 'Креативный штурм',
    status: 'draft',
    crewSize: 0,
    date: '18 мар 2026',
    duration: '--:--:--',
    progress: 0,
  },
]

type FilterTab = 'all' | GameStatus

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'На паузе' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'draft', label: 'Черновики' },
]

export function GameList() {
  const navigate = useNavigate()
  const theme = useAppSelector((s) => s.app.theme)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const filtered = MOCK_GAMES.filter((g) => {
    if (filter !== 'all' && g.status !== filter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: MOCK_GAMES.length,
    active: MOCK_GAMES.filter((g) => g.status === 'active').length,
    paused: MOCK_GAMES.filter((g) => g.status === 'paused').length,
    completed: MOCK_GAMES.filter((g) => g.status === 'completed').length,
    draft: MOCK_GAMES.filter((g) => g.status === 'draft').length,
  }

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{'\u{1F3AE}'}</span>
          <h1 className="text-lg font-bold text-odi-text m-0">
            МОИ ИГРЫ
          </h1>
          <Tag minimal className="text-xs">{MOCK_GAMES.length}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <SettingsMenu />
          <Button
            icon="plus"
            intent="success"
            text="Новая игра"
            onClick={() => navigate('/mission')}
          />
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-odi-surface border-b border-odi-border px-6 py-2 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.value}
              minimal
              small
              active={filter === tab.value}
              onClick={() => setFilter(tab.value)}
              className={filter === tab.value ? '!text-odi-accent' : '!text-odi-text-muted'}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <Tag minimal round className="ml-1 text-[10px]">{counts[tab.value]}</Tag>
              )}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <InputGroup
          leftIcon="search"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          small
          className="!w-64"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <NonIdealState
              icon="search"
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поисковый запрос"
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpen={() => navigate(game.status === 'draft' ? '/mission' : '/game')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, onOpen }: { game: GameListItem; onOpen: () => void }) {
  const cfg = STATUS_CONFIG[game.status]

  return (
    <Card
      interactive
      onClick={onOpen}
      className="!bg-odi-surface !border-odi-border !shadow-none hover:!border-odi-accent/50 transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-odi-text truncate">{game.title}</span>
            <Tag intent={cfg.intent} minimal round className="text-[10px] shrink-0">
              {cfg.label}
            </Tag>
          </div>
          <div className="flex items-center gap-4 text-xs text-odi-text-muted">
            <span>{game.scenario}</span>
            <span>{'\u{1F464}'} {game.crewSize}</span>
            <span>{game.date}</span>
            <span>{game.duration}</span>
          </div>
        </div>

        {/* Right: progress */}
        <div className="w-32 shrink-0">
          <div className="flex items-center justify-between text-xs text-odi-text-muted mb-1">
            <span>Прогресс</span>
            <span>{game.progress}%</span>
          </div>
          <ProgressBar
            value={game.progress / 100}
            intent={game.progress === 100 ? 'success' : 'primary'}
            stripes={false}
            animate={false}
          />
        </div>

        {/* Action */}
        <Button
          icon={game.status === 'draft' ? 'edit' : game.status === 'active' ? 'play' : 'eye-open'}
          minimal
          className="!text-odi-text-muted shrink-0"
        />
      </div>
    </Card>
  )
}
