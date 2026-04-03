import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '@/components/ui/popover'
import {
  Play, Users, LayoutGrid, List,
  Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Search, Settings, Trash2, AlertCircle, Box, Gamepad2,
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setDashboardView } from '@/store/appSlice'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { AppMenu } from '@/components/AppMenu'
import { fetchGames, updateGameTitle, deleteGame, type GameSessionResponse } from '@/api/games'
import { success, error as toastError } from '@/utils/toaster'
import type { GameStatus } from '@/types'

const STATUS_CFG: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  active: { label: 'Активна', variant: 'success' },
  paused: { label: 'Пауза', variant: 'warning' },
  completed: { label: 'Завершена', variant: 'default' },
  draft: { label: 'Черновик', variant: 'outline' },
}

type FilterTab = 'all' | GameStatus
type ViewType = 'grid' | 'table'
type SortKey = 'date' | 'title' | 'status' | 'progress'

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'Пауза' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'draft', label: 'Черновики' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDuration(min: number) {
  if (min > 9000) return '\u221E'
  if (min >= 60) return `${Math.floor(min / 60)}ч ${min % 60}м`
  return `${min} мин`
}

// -- Inline editable title --

function InlineEditableTitle({
  defaultValue,
  onConfirm,
  className = '',
  placeholder = 'Название...',
}: {
  defaultValue: string
  onConfirm: (value: string) => void
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  if (!editing) {
    return (
      <span
        className={`cursor-text hover:bg-muted/50 px-1 -mx-1 rounded ${className}`}
        onClick={() => setEditing(true)}
      >
        {value || placeholder}
      </span>
    )
  }

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false)
        if (value.trim() && value.trim() !== defaultValue) onConfirm(value.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setEditing(false)
          if (value.trim() && value.trim() !== defaultValue) onConfirm(value.trim())
        }
        if (e.key === 'Escape') {
          setValue(defaultValue)
          setEditing(false)
        }
      }}
      placeholder={placeholder}
      className={`bg-transparent border-b border-primary/40 outline-none px-1 -mx-1 ${className}`}
    />
  )
}

// -- Stats Bar --

function StatsBar({ games }: { games: GameSessionResponse[] }) {
  const active = games.filter((g) => g.status === 'active').length
  const paused = games.filter((g) => g.status === 'paused').length
  const completed = games.filter((g) => g.status === 'completed').length
  const draft = games.filter((g) => g.status === 'draft').length
  const totalParticipants = games.reduce((sum, g) => sum + (g.participants?.length ?? g.crewSize), 0)

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
        <Users className="h-3 w-3" />
        <span>{totalParticipants} участников</span>
      </div>
    </div>
  )
}

// -- Table Row --

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
      className="border-b border-border/30 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onOpen}
    >
      {/* Status */}
      <td className="px-3 py-2.5">
        <Badge variant={cfg.variant} className="text-[10px]">
          {cfg.label}
        </Badge>
      </td>

      {/* Title + Scenario */}
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <div>
          <InlineEditableTitle
            defaultValue={game.title}
            className="text-sm font-semibold text-foreground"
            onConfirm={onTitleChange}
            placeholder="Название..."
          />
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {game.scenario?.icon} {game.scenario?.title ?? 'Без сценария'}
        </div>
      </td>

      {/* Team */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span title="Участники"><Users className="h-3 w-3 inline mr-0.5" />{humanCount}</span>
          {botCount > 0 && <span title="Боты">{botCount} бот</span>}
          {onlineCount > 0 && <span className="text-green-400" title="Онлайн">{onlineCount} онл.</span>}
        </div>
      </td>

      {/* Progress */}
      <td className="px-3 py-2.5 w-36">
        <div className="flex items-center gap-2">
          <Progress
            value={game.progress}
            indicatorClassName={game.progress === 100 ? 'bg-success' : undefined}
            className="flex-1 h-1.5"
          />
          <span className="text-[10px] text-muted-foreground w-7 text-right">{game.progress}%</span>
        </div>
      </td>

      {/* Duration */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDuration(game.durationMinutes)}</td>

      {/* Date */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(game.createdAt)}</td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Играть" onClick={() => navigate(`/game/board?session=${game.id}`)}>
            <Play className="h-3.5 w-3.5" />
          </Button>
          {game.status === 'draft' && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Настроить" onClick={onOpen}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" title="Удалить">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto">
              <p className="text-sm text-foreground mb-2">Удалить <strong>{game.title}</strong>?</p>
              <div className="flex gap-2 justify-end">
                <PopoverClose asChild><Button variant="ghost" size="sm">Отмена</Button></PopoverClose>
                <Button variant="destructive" size="sm" onClick={onDelete}>Удалить</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </td>
    </tr>
  )
}

// -- Grid Card --

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
    <Card className="bg-card border-border shadow-none p-3 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {game.scenario?.icon} {game.scenario?.title ?? '—'}
        </span>
        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
      </div>

      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
        <InlineEditableTitle
          defaultValue={game.title}
          className="text-sm font-bold text-foreground"
          onConfirm={onTitleChange}
          placeholder="Название игры..."
        />
      </div>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
        <span><Users className="h-2.5 w-2.5 inline mr-0.5" />{crew - botCount}</span>
        {botCount > 0 && <span>{botCount} бот</span>}
        {onlineCount > 0 && <span className="text-green-400">{onlineCount} онлайн</span>}
        <span>{fmtDuration(game.durationMinutes)}</span>
        <span className="ml-auto">{fmtDate(game.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Progress
          value={game.progress}
          indicatorClassName={game.progress === 100 ? 'bg-success' : undefined}
          className="flex-1"
        />
        <span className="text-[10px] text-muted-foreground w-7 text-right">{game.progress}%</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => navigate(`/game/board?session=${game.id}`)}>
          <Play className="h-3.5 w-3.5 mr-1" /> Играть
        </Button>
        {game.status === 'draft' && (
          <Button variant="outline" size="sm" onClick={onOpen}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="text-red-500" title="Удалить игру">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <p className="text-sm text-foreground mb-2">Удалить <strong>{game.title}</strong>?</p>
            <div className="flex gap-2 justify-end">
              <PopoverClose asChild><Button variant="ghost" size="sm">Отмена</Button></PopoverClose>
              <Button variant="destructive" size="sm" onClick={onDelete}>Удалить</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Card>
  )
}

// -- Main --

const PAGE_SIZE = 20

export function GameList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
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
    return sortAsc
      ? <ChevronUp className="inline h-2.5 w-2.5 ml-0.5" />
      : <ChevronDown className="inline h-2.5 w-2.5 ml-0.5" />
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-sm font-bold text-foreground m-0 uppercase">Мои игры</h1>
          <Badge variant="outline" className="text-[10px]">{total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="w-px h-5 bg-border/50" />
          <div className="flex gap-0.5">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('grid')}
              title="Сетка"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('table')}
              title="Таблица"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-px h-5 bg-border/50" />
          <AppMenu />
          <AccountBadge />
          <SettingsMenu />
          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => navigate('/mission')}>
            <Plus className="h-4 w-4 mr-1" /> Новая игра
          </Button>
        </div>
      </header>

      {/* Filters + Stats */}
      <div className="bg-card border-b border-border px-5 py-2 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {FILTERS.map((tab) => {
            const count = tab.value === 'all' ? total : games.filter((g) => g.status === tab.value).length
            return (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(tab.value)}
                className={`text-xs ${filter === tab.value ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {tab.label}
                {filter === 'all' && tab.value !== 'all' && count > 0 && (
                  <Badge variant="outline" className="text-[9px] ml-1">{count}</Badge>
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
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Ошибка</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" onClick={loadGames}>Повторить</Button>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              {search || filter !== 'all' ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Ничего не найдено</h2>
                  <p className="text-sm text-muted-foreground">Измените фильтры или запрос</p>
                </>
              ) : (
                <>
                  <Box className="h-12 w-12 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Нет игр</h2>
                  <p className="text-sm text-muted-foreground">Создайте первую игру</p>
                  <Button className="bg-success hover:bg-success/90" onClick={() => navigate('/mission')}>
                    <Plus className="h-4 w-4 mr-1" /> Создать игру
                  </Button>
                </>
              )}
            </div>
          ) : view === 'table' ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[11px] text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-foreground transition-colors w-24" onClick={() => handleSort('status')}>
                      Статус<SortIcon col="status" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('title')}>
                      Название<SortIcon col="title" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-32">Команда</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-foreground transition-colors w-36" onClick={() => handleSort('progress')}>
                      Прогресс<SortIcon col="progress" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium w-20">Время</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer hover:text-foreground transition-colors w-28" onClick={() => handleSort('date')}>
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
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
