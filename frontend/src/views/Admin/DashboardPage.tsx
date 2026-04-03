import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { fetchAdminSessions, type AdminSessionResponse } from '@/api/admin-sessions'

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'outline' }> = {
  active: { label: 'Активна', variant: 'success' },
  paused: { label: 'Пауза', variant: 'warning' },
  completed: { label: 'Завершена', variant: 'default' },
  draft: { label: 'Черновик', variant: 'outline' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function DashboardPage() {
  const [sessions, setSessions] = useState<AdminSessionResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminSessions({ limit: 10 })
      .then((res) => {
        setSessions(res.items)
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeCount = sessions.filter((s) => s.status === 'active').length
  const pausedCount = sessions.filter((s) => s.status === 'paused').length
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Дашборд</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-none p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Всего сессий</div>
          <div className="text-2xl font-bold text-foreground mt-1">{total}</div>
        </Card>
        <Card className="bg-card border-border shadow-none p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Активные</div>
          <div className="text-2xl font-bold text-foreground mt-1">{activeCount}</div>
        </Card>
        <Card className="bg-card border-border shadow-none p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">На паузе</div>
          <div className="text-2xl font-bold text-foreground mt-1">{pausedCount}</div>
        </Card>
        <Card className="bg-card border-border shadow-none p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Завершённые</div>
          <div className="text-2xl font-bold text-foreground mt-1">{completedCount}</div>
        </Card>
      </div>

      {/* Recent sessions */}
      <Card className="bg-card border-border shadow-none p-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          Последние сессии
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Сессий пока нет</p>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => {
              const cfg = STATUS_MAP[s.status] ?? STATUS_MAP.draft
              const humanCount = s.participants?.filter((p) => p.user).length ?? 0
              const botCount = s.participants?.filter((p) => p.botConfig).length ?? 0

              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {s.host?.name ?? 'Неизвестный'}{' '}
                      &middot; {humanCount} чел. {botCount > 0 && `+ ${botCount} бот`}{' '}
                      &middot; {formatDate(s.createdAt)}
                      {s.scenario && <> &middot; {s.scenario.icon} {s.scenario.title}</>}
                    </div>
                  </div>
                  <Badge variant={cfg.variant} className="text-[10px] ml-3 shrink-0">{cfg.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
