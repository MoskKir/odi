import { Card, Tag, ProgressBar } from '@blueprintjs/core'

const STATS = [
  { label: 'Пользователи', value: '1 247', change: '+12%', icon: '\u{1F465}', intent: 'primary' as const },
  { label: 'Активные сессии', value: '23', change: '+3', icon: '\u{1F3AE}', intent: 'success' as const },
  { label: 'AI-боты', value: '8', change: '', icon: '\u{1F916}', intent: 'warning' as const },
  { label: 'Сценариев', value: '15', change: '+2 новых', icon: '\u{1F4CB}', intent: 'primary' as const },
]

const RECENT_SESSIONS = [
  { title: 'Стратегия развития 2026', user: 'Анна К.', status: 'active', players: 4 },
  { title: 'Редизайн продукта', user: 'Борис М.', status: 'active', players: 3 },
  { title: 'Интеграция команды', user: 'Елена В.', status: 'paused', players: 6 },
  { title: 'Хакатон AI', user: 'Дмитрий С.', status: 'completed', players: 5 },
]

const SYSTEM_HEALTH = [
  { label: 'CPU', value: 34, intent: 'success' as const },
  { label: 'RAM', value: 62, intent: 'warning' as const },
  { label: 'Диск', value: 45, intent: 'success' as const },
  { label: 'API latency', value: 12, intent: 'success' as const },
]

const STATUS_MAP: Record<string, { label: string; intent: 'success' | 'warning' | 'primary' }> = {
  active: { label: 'Активна', intent: 'success' },
  paused: { label: 'Пауза', intent: 'warning' },
  completed: { label: 'Завершена', intent: 'primary' },
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-odi-text">Дашборд</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="!bg-odi-surface !border-odi-border !shadow-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-odi-text-muted uppercase tracking-wider">{stat.label}</div>
                <div className="text-2xl font-bold text-odi-text mt-1">{stat.value}</div>
                {stat.change && (
                  <Tag minimal intent={stat.intent} className="text-[10px] mt-1">{stat.change}</Tag>
                )}
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent sessions */}
        <Card className="!bg-odi-surface !border-odi-border !shadow-none">
          <h3 className="text-sm font-bold text-odi-text uppercase tracking-wider mb-3">
            Последние сессии
          </h3>
          <div className="space-y-2">
            {RECENT_SESSIONS.map((s, i) => {
              const cfg = STATUS_MAP[s.status]
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-odi-surface-hover">
                  <div>
                    <div className="text-sm text-odi-text font-medium">{s.title}</div>
                    <div className="text-xs text-odi-text-muted">{s.user} &middot; {s.players} игроков</div>
                  </div>
                  <Tag minimal intent={cfg.intent} round className="text-[10px]">{cfg.label}</Tag>
                </div>
              )
            })}
          </div>
        </Card>

        {/* System health */}
        <Card className="!bg-odi-surface !border-odi-border !shadow-none">
          <h3 className="text-sm font-bold text-odi-text uppercase tracking-wider mb-3">
            Состояние системы
          </h3>
          <div className="space-y-4">
            {SYSTEM_HEALTH.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-odi-text-muted mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <ProgressBar value={item.value / 100} intent={item.intent} stripes={false} animate={false} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
