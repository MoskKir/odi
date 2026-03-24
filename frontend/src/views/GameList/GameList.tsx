import { Button, Card, Tag, ProgressBar, NonIdealState, InputGroup, Spinner, EditableText, Popover, ButtonGroup, Icon } from '@blueprintjs/core'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setDashboardView } from '@/store/appSlice'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { fetchGames, updateGameTitle, deleteGame, type GameSessionResponse } from '@/api/games'
import { success, error as toastError } from '@/utils/toaster'
import type { GameStatus } from '@/types'

const STATUS_CFG: Record<string, { label: string; intent: 'success' | 'warning' | 'primary' | 'none'; icon: string }> = {
  active: { label: 'Активна', intent: 'success', icon: 'play' },
  paused: { label: 'Пауза', intent: 'warning', icon: 'pause' },
  completed: { label: 'Завершена', intent: 'primary', icon: 'tick-circle' },
  draft: { label: 'Черновик', intent: 'none', icon: 'document' },
}

type FilterTab = 'all' | GameStatus
type ViewType = 'grid' | 'table'
type SortKey = 'date' | 'title' | 'status' | 'progress'

const FILTERS: { value: FilterTab; label: string; icon: string }[] = [
  { value: 'all', label: 'Все', icon: 'applications' },
  { value: 'active', label: 'Активные', icon: 'play' },
  { value: 'paused', label: 'Пауза', icon: 'pause' },
  { value: 'completed', label: 'Завершённые', icon: 'tick-circle' },
  { value: 'draft', label: 'Черновики', icon: 'document' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(min: number) {
  if (min > 9000) return '\u221E'
  if (min >= 60) return `${Math.floor(min / 60)}ч ${min % 60}м`
  return `${min} мин`
}

// ── Stats Bar ──

function StatsBar({ games }: { games: GameSessionResponse[] }) {
  const active = games.filter((g) => g.status === 'active').length
  const paused = games.filter((g) => g.status === 'paused').length
  const completed = games.filter((g) => g.status === 'completed').length
  const draft = games.filter((g) => g.status === 'draft').length
  const totalParticipants = games.reduce((sum, g) => sum + (g.participants?.length ?? g.crewSize), 0)

  return (
    <div className="flex items-center gap-4 text-xs text-odi-text-muted">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span>{active} активных</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        <span>{paused} на паузе</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span>{completed} завершено</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-500" />
        <span>{draft} черновиков</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Icon icon="people" size={12} />
        <span>{totalParticipants} участников</span>
      </div>
    </div>
  )
}

// ── Table Row ──

function GameRow({
  game,
  onOpen,
  onTitleChange,
  onDelete,
}: {
  game: GameSessionResponse
  onOpen: () => void
  onTitleChange: (title: string) => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const cfg = STATUS_CFG[game.status] ?? STATUS_CFG.draft
  const crew = game.participants?.length ?? game.crewSize
  const onlineCount = game.participants?.filter((p) => p.isOnline).length ?? 0
  const botCount = game.participants?.filter((p) => p.botConfig).length ?? 0
  const humanCount = crew - botCount

  return (
    <tr
      className="border-b border-odi-border/30 hover:bg-odi-surface-hover/50 transition-colors cursor-pointer group"
      onClick={onOpen}
    >
      {/* Status */}
      <td className="px-3 py-2.5">
        <Tag intent={cfg.intent} minimal round className="!text-[10px]">
          {cfg.label}
        </Tag>
      </td>

      {/* Title + Scenario */}
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <div>
          <EditableText
            defaultValue={game.title}
            className="!text-sm !font-semibold !text-odi-text"
            onConfirm={onTitleChange}
            selectAllOnFocus
            placeholder="Название..."
          />
        </div>
        <div className="text-[11px] text-odi-text-muted mt-0.5">
          {game.scenario?.icon} {game.scenario?.title ?? 'Без сценария'}
        </div>
      </td>

      {/* Team */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-odi-text-muted">
          <span title="Участники"><Icon icon="people" size={11} className="mr-0.5" />{humanCount}</span>
          {botCount > 0 && <span title="Боты"><Icon icon="desktop" size={11} className="mr-0.5" />{botCount}</span>}
          {onlineCount > 0 && <span className="text-green-400" title="Онлайн"><Icon icon="dot" size={11} />{onlineCount}</span>}
        </div>
      </td>

      {/* Progress */}
      <td className="px-3 py-2.5 w-36">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={game.progress / 100}
            intent={game.progress === 100 ? 'success' : 'primary'}
            stripes={false}
            animate={false}
            className="flex-1 !h-1.5"
          />
          <span className="text-[10px] text-odi-text-muted w-7 text-right">{game.progress}%</span>
        </div>
      </td>

      {/* Duration */}
      <td className="px-3 py-2.5 text-xs text-odi-text-muted">{fmtDuration(game.durationMinutes)}</td>

      {/* Date */}
      <td className="px-3 py-2.5 text-xs text-odi-text-muted">{fmtDate(game.createdAt)}</td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button small minimal icon="play" intent="primary" title="Играть" onClick={() => navigate(`/game/board?session=${game.id}`)} />
          {game.status === 'draft' && <Button small minimal icon="cog" title="Настроить" onClick={onOpen} />}
          <Popover
            placement="bottom-end"
            content={
              <div className="p-3">
                <p className="text-sm text-odi-text mb-2">Удалить <strong>{game.title}</strong>?</p>
                <div className="flex gap-2 justify-end">
                  <Button small minimal text="Отмена" className="bp5-popover-dismiss" />
                  <Button small intent="danger" text="Удалить" onClick={onDelete} className="bp5-popover-dismiss" />
                </div>
              </div>
            }
          >
            <Button small minimal icon="trash" intent="danger" title="Удалить" />
          </Popover>
        </div>
      </td>
    </tr>
  )
}

// ── Grid Card ──

function GameCard({
  game,
  onOpen,
  onTitleChange,
  onDelete,
}: {
  game: GameSessionResponse
  onOpen: () => void
  onTitleChange: (title: string) => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const cfg = STATUS_CFG[game.status] ?? STATUS_CFG.draft
  const crew = game.participants?.length ?? game.crewSize
  const botCount = game.participants?.filter((p) => p.botConfig).length ?? 0
  const onlineCount = game.participants?.filter((p) => p.isOnline).length ?? 0

  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-3 hover:!border-odi-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-odi-text-muted">
          {game.scenario?.icon} {game.scenario?.title ?? '—'}
        </span>
        <Tag intent={cfg.intent} minimal round className="text-[10px]">{cfg.label}</Tag>
      </div>

      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
        <EditableText
          defaultValue={game.title}
          className="!text-sm !font-bold !text-odi-text"
          onConfirm={onTitleChange}
          selectAllOnFocus
          placeholder="Название игры..."
        />
      </div>

      <div className="flex items-center gap-3 text-[11px] text-odi-text-muted mb-2">
        <span><Icon icon="people" size={10} className="mr-0.5" />{crew - botCount}</span>
        {botCount > 0 && <span><Icon icon="desktop" size={10} className="mr-0.5" />{botCount}</span>}
        {onlineCount > 0 && <span className="text-green-400"><Icon icon="dot" size={10} />{onlineCount} онлайн</span>}
        <span>{fmtDuration(game.durationMinutes)}</span>
        <span className="ml-auto">{fmtDate(game.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <ProgressBar
          value={game.progress / 100}
          intent={game.progress === 100 ? 'success' : 'primary'}
          stripes={false}
          animate={false}
          className="flex-1"
        />
        <span className="text-[10px] text-odi-text-muted w-7 text-right">{game.progress}%</span>
      </div>

      <div className="flex gap-2">
        <Button small fill intent="primary" icon="play" text="Играть" onClick={() => navigate(`/game/board?session=${game.id}`)} />
        {game.status === 'draft' && <Button small outlined icon="cog" onClick={onOpen} />}
        <Popover
          placement="bottom-end"
          content={
            <div className="p-3">
              <p className="text-sm text-odi-text mb-2">Удалить <strong>{game.title}</strong>?</p>
              <div className="flex gap-2 justify-end">
                <Button small minimal text="Отмена" className="bp5-popover-dismiss" />
                <Button small intent="danger" text="Удалить" onClick={onDelete} className="bp5-popover-dismiss" />
              </div>
            </div>
          }
        >
          <Button small minimal icon="trash" intent="danger" title="Удалить игру" />
        </Popover>
      </div>
    </Card>
  )
}

// ── Main ──

const PAGE_SIZE = 20

export function GameList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const theme = useAppSelector((s) => s.app.theme)
  const savedView = useAppSelector((s) => s.app.dashboardView) as ViewType
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [games, setGames] = useState<GameSessionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const view = savedView || 'table'
  const setView = (v: ViewType) => dispatch(setDashboardView(v))
  const [sort, setSort] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)

  const loadGames = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: { status?: string; search?: string; limit?: number; offset?: number } = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }
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
  }, [filter, search, page])

  useEffect(() => { loadGames() }, [loadGames])

  // Reset page on filter/search change
  useEffect(() => { setPage(0) }, [filter, search])

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

  const handleDelete = async (id: string) => {
    try {
      await deleteGame(id)
      setGames((prev) => prev.filter((g) => g.id !== id))
      setTotal((t) => t - 1)
      success('Игра удалена')
    } catch {
      toastError('Не удалось удалить игру')
    }
  }

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setSortAsc(!sortAsc)
    } else {
      setSort(key)
      setSortAsc(false)
    }
  }

  const sorted = useMemo(() => {
    const copy = [...games]
    const dir = sortAsc ? 1 : -1
    copy.sort((a, b) => {
      switch (sort) {
        case 'title': return dir * a.title.localeCompare(b.title)
        case 'status': return dir * a.status.localeCompare(b.status)
        case 'progress': return dir * (a.progress - b.progress)
        case 'date':
        default: return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }
    })
    return copy
  }, [games, sort, sortAsc])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort !== col) return null
    return <Icon icon={sortAsc ? 'chevron-up' : 'chevron-down'} size={10} className="ml-0.5" />
  }

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex flex-col bg-odi-bg`}>
      {/* Header */}
      <header className="bg-odi-surface border-b border-odi-border px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">{'\u{1F3AE}'}</span>
          <h1 className="text-sm font-bold text-odi-text m-0 uppercase">Мои игры</h1>
          <Tag minimal className="text-[10px]">{total}</Tag>
        </div>
        <div className="flex items-center gap-2">
          <InputGroup
            leftIcon="search"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            small
            className="!w-56"
          />
          <div className="w-px h-5 bg-odi-border/50" />
          <ButtonGroup minimal>
            <Button icon="grid-view" small active={view === 'grid'} onClick={() => setView('grid')} title="Сетка" />
            <Button icon="th" small active={view === 'table'} onClick={() => setView('table')} title="Таблица" />
          </ButtonGroup>
          <div className="w-px h-5 bg-odi-border/50" />
          <AccountBadge />
          <SettingsMenu />
          <Button icon="plus" intent="success" small text="Новая игра" onClick={() => navigate('/mission')} />
        </div>
      </header>

      {/* Filters + Stats */}
      <div className="bg-odi-surface border-b border-odi-border px-5 py-2 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {FILTERS.map((tab) => {
            const count = tab.value === 'all' ? total : games.filter((g) => g.status === tab.value).length
            return (
              <Button
                key={tab.value}
                minimal
                small
                active={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={`!text-xs ${filter === tab.value ? '!text-odi-accent' : '!text-odi-text-muted'}`}
              >
                {tab.label}
                {filter === 'all' && tab.value !== 'all' && count > 0 && (
                  <Tag minimal round className="!text-[9px] ml-1">{count}</Tag>
                )}
              </Button>
            )
          })}
        </div>
        {!loading && games.length > 0 && <StatsBar games={games} />}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size={32} /></div>
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
              description={search || filter !== 'all' ? 'Измените фильтры или запрос' : 'Создайте первую игру'}
              action={!search && filter === 'all' ? <Button intent="success" icon="plus" text="Создать игру" onClick={() => navigate('/mission')} /> : undefined}
            />
          ) : view === 'table' ? (
            <div className="bg-odi-surface border border-odi-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-odi-border bg-odi-bg/50 text-[11px] text-odi-text-muted uppercase tracking-wider">
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-odi-text transition-colors w-24" onClick={() => handleSort('status')}>
                      Статус<SortIcon col="status" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-odi-text transition-colors" onClick={() => handleSort('title')}>
                      Название<SortIcon col="title" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-32">Команда</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-odi-text transition-colors w-36" onClick={() => handleSort('progress')}>
                      Прогресс<SortIcon col="progress" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-20">Время</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-odi-text transition-colors w-28" onClick={() => handleSort('date')}>
                      Дата<SortIcon col="date" />
                    </th>
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((game) => (
                    <GameRow
                      key={game.id}
                      game={game}
                      onOpen={() => goToGame(game)}
                      onTitleChange={(t) => handleTitleChange(game.id, t)}
                      onDelete={() => handleDelete(game.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onOpen={() => goToGame(game)}
                  onTitleChange={(t) => handleTitleChange(game.id, t)}
                  onDelete={() => handleDelete(game.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                small
                minimal
                icon="chevron-left"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              />
              <span className="text-xs text-odi-text-muted">
                {page + 1} / {totalPages}
              </span>
              <Button
                small
                minimal
                icon="chevron-right"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
