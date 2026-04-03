import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  ChevronRight,
  Eye,
  Pause,
  Play,
  Square,
  Search,
  AlertCircle,
} from 'lucide-react'
import {
  fetchAdminSessions,
  updateSessionStatus,
  type AdminSessionResponse,
} from '@/api/admin-sessions'
import { success, error as toastError } from '@/utils/toaster'

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  active: { label: 'Активна', variant: 'success' },
  paused: { label: 'Пауза', variant: 'warning' },
  completed: { label: 'Завершена', variant: 'default' },
  draft: { label: 'Черновик', variant: 'outline' },
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDuration(minutes: number): string {
  if (minutes > 9000) return '\u221E'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function SessionsPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<AdminSessionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadSessions = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchAdminSessions({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 200,
    })
      .then((data) => {
        if (cancelled) return
        setSessions(data.items)
        setTotal(data.total)
      })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить сессии') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [statusFilter])

  useEffect(() => loadSessions(), [loadSessions])

  const toggle = (id: string) => setExpandedId((prev) => prev === id ? null : id)

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      await updateSessionStatus(id, newStatus)
      setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s))
      success('Статус обновлён')
    } catch {
      toastError('Не удалось обновить статус')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = search
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions

  const activeCnt = sessions.filter((s) => s.status === 'active').length
  const totalPlayers = sessions
    .filter((s) => s.status === 'active')
    .reduce((a, s) => (s.participants?.filter((p) => p.isOnline).length ?? 0) + a, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Игровые сессии</h2>
        <div className="flex items-center gap-2">
          <Badge variant="success">{activeCnt} активных</Badge>
          <Badge variant="outline">{totalPlayers} игроков онлайн</Badge>
          <Badge variant="outline">{total} всего</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="paused">На паузе</SelectItem>
            <SelectItem value="completed">Завершённые</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Badge variant="outline">{filtered.length} показано</Badge>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Ошибка</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" onClick={loadSessions}>Повторить</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {search || statusFilter !== 'all' ? (
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
          ) : (
            <Play className="h-12 w-12 text-muted-foreground mb-3" />
          )}
          <h3 className="text-lg font-medium text-foreground mb-1">
            {search || statusFilter !== 'all' ? 'Ничего не найдено' : 'Нет сессий'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== 'all' ? 'Измените фильтры' : 'Сессии появятся здесь после создания'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const cfg = STATUS_MAP[session.status] ?? STATUS_MAP.draft
            const isOpen = expandedId === session.id
            const humanCount = session.participants?.filter((p) => p.userId).length ?? 0
            const botCount = session.participants?.filter((p) => p.botConfigId).length ?? 0

            return (
              <Card key={session.id} className="bg-card border-border shadow-none p-0">
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggle(session.id)}
                  >
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    />
                    {session.scenario?.icon && (
                      <span className="text-xl shrink-0">{session.scenario.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-foreground truncate">{session.title}</span>
                        <Badge variant={cfg.variant} className="text-[10px] shrink-0">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {session.scenario && <span>{session.scenario.title}</span>}
                        {session.host && <span>Хост: {session.host.name}</span>}
                        <span>{humanCount} чел. + {botCount} ботов</span>
                        <span>{fmtDate(session.startedAt || session.createdAt)}</span>
                        <span>{fmtDuration(session.durationMinutes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="w-28 shrink-0">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Прогресс</span>
                      <span>{session.progress}%</span>
                    </div>
                    <Progress
                      value={session.progress}
                      indicatorClassName={session.progress === 100 ? 'bg-green-500' : 'bg-primary'}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Открыть"
                      onClick={() => navigate(`/game/board?session=${session.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {session.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-500 hover:text-amber-600"
                        title="Пауза"
                        disabled={updating === session.id}
                        onClick={() => handleStatusChange(session.id, 'paused')}
                      >
                        {updating === session.id ? <Spinner size={16} /> : <Pause className="h-4 w-4" />}
                      </Button>
                    )}
                    {session.status === 'paused' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600"
                        title="Продолжить"
                        disabled={updating === session.id}
                        onClick={() => handleStatusChange(session.id, 'active')}
                      >
                        {updating === session.id ? <Spinner size={16} /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    {session.status !== 'completed' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            title="Завершить"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                          <p className="text-sm text-foreground mb-2">Завершить <strong>{session.title}</strong>?</p>
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost">Отмена</Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updating === session.id}
                              onClick={() => handleStatusChange(session.id, 'completed')}
                            >
                              {updating === session.id ? <Spinner size={14} /> : 'Завершить'}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-border px-4 py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                      <div>
                        <div className="text-muted-foreground mb-1">Сложность</div>
                        <div className="text-foreground capitalize">{session.difficulty}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Интерфейс</div>
                        <div className="text-foreground">{session.interfaceMode}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">AI видимость</div>
                        <div className="text-foreground">{session.aiVisibility}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Энергия</div>
                        <div className="text-foreground">{session.energy}/10</div>
                      </div>
                    </div>

                    {session.participants && session.participants.length > 0 && (
                      <>
                        <div className="text-xs text-muted-foreground font-medium mb-2">
                          Участники ({session.participants.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {session.participants.map((p) => (
                            <Badge
                              key={p.id}
                              variant={p.isOnline ? 'success' : 'outline'}
                              className="text-[10px]"
                            >
                              {p.botConfig
                                ? `🤖 ${p.botConfig.name}`
                                : p.user?.name ?? 'Участник'
                              }
                              {p.isOnline ? ' (online)' : ''}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Создана: {fmtDate(session.createdAt)}</span>
                      {session.startedAt && <span>Начата: {fmtDate(session.startedAt)}</span>}
                      {session.completedAt && <span>Завершена: {fmtDate(session.completedAt)}</span>}
                      <span className="font-mono">{session.id.slice(0, 8)}</span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
