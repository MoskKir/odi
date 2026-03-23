import { Button, Card, Tag, ProgressBar, NonIdealState, InputGroup, Spinner, EditableText } from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { fetchGames, updateGameTitle, type GameSessionResponse } from '@/api/games'
import { success, error as toastError } from '@/utils/toaster'
import type { GameStatus } from '@/types'

const STATUS_CFG: Record<string, { label: string; intent: 'success' | 'warning' | 'primary' | 'none' }> = {
  active: { label: 'Активна', intent: 'success' },
  paused: { label: 'Пауза', intent: 'warning' },
  completed: { label: 'Завершена', intent: 'primary' },
  draft: { label: 'Черновик', intent: 'none' },
}

type FilterTab = 'all' | GameStatus

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'Пауза' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'draft', label: 'Черновики' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function GameList() {
  const navigate = useNavigate()
  const theme = useAppSelector((s) => s.app.theme)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [games, setGames] = useState<GameSessionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGames = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: { status?: string; search?: string } = {}
      if (filter !== 'all') params.status = filter
      if (search.trim()) params.search = search.trim()
      const res = await fetchGames(params)
      setGames(res.items)
      setTotal(res.total)
    } catch {
      setError('Не удалось загрузить список игр')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { loadGames() }, [loadGames])

  const goToGame = (game: GameSessionResponse) => {
    if (game.status === 'draft') {
      navigate(`/mission?session=${game.id}`)
    } else {
      navigate(`/game/board?session=${game.id}`)
    }
  }

  const handleTitleChange = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    try {
      await updateGameTitle(id, trimmed)
      setGames((prev) => prev.map((g) => g.id === id ? { ...g, title: trimmed } : g))
      success('Название обновлено')
    } catch {
      toastError('Не удалось обновить название')
    }
  }

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{'\u{1F3AE}'}</span>
          <h1 className="text-sm font-bold text-odi-text m-0 uppercase">Мои игры</h1>
          <Tag minimal className="text-[10px]">{total}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <InputGroup
            leftIcon="search"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            small
            className="!w-48"
          />
          <AccountBadge />
          <SettingsMenu />
          <Button icon="plus" intent="success" small text="Новая" onClick={() => navigate('/mission')} />
        </div>
      </header>

      {/* Filters */}
      <div className="bg-odi-surface border-b border-odi-border px-4 py-1.5 flex items-center gap-1 shrink-0">
        {FILTERS.map((tab) => (
          <Button
            key={tab.value}
            minimal
            small
            active={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={`!text-xs ${filter === tab.value ? '!text-odi-accent' : '!text-odi-text-muted'}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size={32} /></div>
          ) : error ? (
            <NonIdealState
              icon="error"
              title="Ошибка"
              description={error}
              action={<Button text="Повторить" small onClick={loadGames} />}
            />
          ) : games.length === 0 ? (
            <NonIdealState
              icon={search || filter !== 'all' ? 'search' : 'cube'}
              title={search || filter !== 'all' ? 'Ничего не найдено' : 'Нет игр'}
              description={
                search || filter !== 'all'
                  ? 'Измените фильтры или запрос'
                  : 'Нажмите «Новая» чтобы создать игру'
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpen={() => goToGame(game)}
                  onTitleChange={(t) => handleTitleChange(game.id, t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GameCard({
  game,
  onOpen,
  onTitleChange,
}: {
  game: GameSessionResponse
  onOpen: () => void
  onTitleChange: (title: string) => void
}) {
  const navigate = useNavigate()
  const cfg = STATUS_CFG[game.status] ?? STATUS_CFG.draft
  const crew = game.participants?.length ?? game.crewSize

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-3">
      {/* Top row: scenario icon + status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-odi-text-muted">
          {game.scenario?.icon} {game.scenario?.title ?? '—'}
        </span>
        <Tag intent={cfg.intent} minimal round className="text-[10px]">
          {cfg.label}
        </Tag>
      </div>

      {/* Title — click to edit */}
      <div className="mb-2 group">
        <EditableText
          defaultValue={game.title}
          className="!text-sm !font-bold !text-odi-text"
          onConfirm={onTitleChange}
          selectAllOnFocus
          placeholder="Название игры..."
        />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-odi-text-muted mb-2">
        <span>{'\u{1F464}'} {crew}</span>
        <span>{fmtDate(game.createdAt)}</span>
        <span>{game.durationMinutes > 9000 ? '\u221E' : `${game.durationMinutes} мин`}</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-3">
        <ProgressBar
          value={game.progress / 100}
          intent={game.progress === 100 ? 'success' : 'primary'}
          stripes={false}
          animate={false}
          className="flex-1"
        />
        <span className="text-[10px] text-odi-text-muted w-7 text-right">
          {game.progress}%
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          small
          fill
          intent="primary"
          icon="play"
          text="Играть"
          onClick={() => navigate(`/game/board?session=${game.id}`)}
        />
        {game.status === 'draft' && (
          <Button
            small
            outlined
            icon="cog"
            onClick={onOpen}
          />
        )}
      </div>
    </Card>
  )
}
