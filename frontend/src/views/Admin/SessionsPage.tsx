import {
  Card,
  Tag,
  Button,
  InputGroup,
  HTMLSelect,
  ProgressBar,
  Spinner,
  NonIdealState,
  Icon,
  Popover,
} from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAdminSessions,
  updateSessionStatus,
  type AdminSessionResponse,
} from '@/api/admin-sessions'

const STATUS_MAP: Record<string, { label: string; intent: 'success' | 'warning' | 'primary' | 'none' }> = {
  active: { label: 'Активна', intent: 'success' },
  paused: { label: 'Пауза', intent: 'warning' },
  completed: { label: 'Завершена', intent: 'primary' },
  draft: { label: 'Черновик', intent: 'none' },
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
    } catch {
      setError('Не удалось обновить статус')
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
        <h2 className="text-xl font-bold text-odi-text">Игровые сессии</h2>
        <div className="flex items-center gap-2">
          <Tag intent="success" minimal>{activeCnt} активных</Tag>
          <Tag minimal>{totalPlayers} игроков онлайн</Tag>
          <Tag minimal>{total} всего</Tag>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <InputGroup
          leftIcon="search"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!w-64"
        />
        <HTMLSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="paused">На паузе</option>
          <option value="completed">Завершённые</option>
          <option value="draft">Черновики</option>
        </HTMLSelect>
        <div className="flex-1" />
        <Tag minimal>{filtered.length} показано</Tag>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={loadSessions} />}
        />
      ) : filtered.length === 0 ? (
        <NonIdealState
          icon={search || statusFilter !== 'all' ? 'search' : 'play'}
          title={search || statusFilter !== 'all' ? 'Ничего не найдено' : 'Нет сессий'}
          description={search || statusFilter !== 'all' ? 'Измените фильтры' : 'Сессии появятся здесь после создания'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const cfg = STATUS_MAP[session.status] ?? STATUS_MAP.draft
            const isOpen = expandedId === session.id
            const humanCount = session.participants?.filter((p) => p.userId).length ?? 0
            const botCount = session.participants?.filter((p) => p.botConfigId).length ?? 0
            const onlineCount = session.participants?.filter((p) => p.isOnline).length ?? 0

            return (
              <Card key={session.id} className="!bg-odi-surface !border-odi-border !shadow-none !p-0">
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggle(session.id)}
                  >
                    <Icon
                      icon="chevron-right"
                      className={`text-odi-text-muted transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    />
                    {session.scenario?.icon && (
                      <span className="text-xl shrink-0">{session.scenario.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-odi-text truncate">{session.title}</span>
                        <Tag intent={cfg.intent} minimal round className="text-[10px] shrink-0">{cfg.label}</Tag>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-odi-text-muted">
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
                    <div className="flex justify-between text-xs text-odi-text-muted mb-1">
                      <span>Прогресс</span>
                      <span>{session.progress}%</span>
                    </div>
                    <ProgressBar
                      value={session.progress / 100}
                      intent={session.progress === 100 ? 'success' : 'primary'}
                      stripes={false}
                      animate={false}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      icon="eye-open"
                      minimal
                      small
                      title="Открыть"
                      onClick={() => navigate(`/game/board?session=${session.id}`)}
                    />
                    {session.status === 'active' && (
                      <Button
                        icon="pause"
                        minimal
                        small
                        intent="warning"
                        title="Пауза"
                        loading={updating === session.id}
                        onClick={() => handleStatusChange(session.id, 'paused')}
                      />
                    )}
                    {session.status === 'paused' && (
                      <Button
                        icon="play"
                        minimal
                        small
                        intent="success"
                        title="Продолжить"
                        loading={updating === session.id}
                        onClick={() => handleStatusChange(session.id, 'active')}
                      />
                    )}
                    {session.status !== 'completed' && (
                      <Popover
                        placement="bottom-end"
                        content={
                          <div className="p-3">
                            <p className="text-sm text-odi-text mb-2">Завершить <strong>{session.title}</strong>?</p>
                            <div className="flex gap-2 justify-end">
                              <Button small minimal text="Отмена" className="bp5-popover-dismiss" />
                              <Button
                                small
                                intent="danger"
                                text="Завершить"
                                loading={updating === session.id}
                                onClick={() => handleStatusChange(session.id, 'completed')}
                              />
                            </div>
                          </div>
                        }
                      >
                        <Button icon="stop" minimal small intent="danger" title="Завершить" />
                      </Popover>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-odi-border px-4 py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                      <div>
                        <div className="text-odi-text-muted mb-1">Сложность</div>
                        <div className="text-odi-text capitalize">{session.difficulty}</div>
                      </div>
                      <div>
                        <div className="text-odi-text-muted mb-1">Интерфейс</div>
                        <div className="text-odi-text">{session.interfaceMode}</div>
                      </div>
                      <div>
                        <div className="text-odi-text-muted mb-1">AI видимость</div>
                        <div className="text-odi-text">{session.aiVisibility}</div>
                      </div>
                      <div>
                        <div className="text-odi-text-muted mb-1">Энергия</div>
                        <div className="text-odi-text">{session.energy}/10</div>
                      </div>
                    </div>

                    {session.participants && session.participants.length > 0 && (
                      <>
                        <div className="text-xs text-odi-text-muted font-medium mb-2">
                          Участники ({session.participants.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {session.participants.map((p) => (
                            <Tag
                              key={p.id}
                              minimal
                              round
                              intent={p.isOnline ? 'success' : 'none'}
                              className="text-[10px]"
                            >
                              {p.botConfig
                                ? `${'\u{1F916}'} ${p.botConfig.name}`
                                : p.user?.name ?? 'Участник'
                              }
                              {p.isOnline ? ' (online)' : ''}
                            </Tag>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-odi-text-muted">
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
