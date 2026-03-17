import { Card, ProgressBar, Tag } from '@blueprintjs/core'

const TEAM_STATS = [
  { name: 'Анна', xp: 450, level: 3, badge: 'Генератор идей' },
  { name: 'Борис', xp: 380, level: 2, badge: 'Аналитик' },
  { name: 'Визионер', xp: 600, level: 4, badge: 'AI-помощник' },
  { name: 'Модератор', xp: 520, level: 3, badge: 'Координатор' },
]

export function HQView() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-odi-text mb-4">Штаб команды</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEAM_STATS.map((member) => (
          <Card
            key={member.name}
            className="!bg-odi-surface-hover !border-odi-border !shadow-none"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-odi-text">{member.name}</span>
              <Tag intent="primary" minimal round>
                Lv.{member.level}
              </Tag>
            </div>
            <div className="text-xs text-odi-text-muted mb-1">
              XP: {member.xp} / {member.level * 200}
            </div>
            <ProgressBar
              value={member.xp / (member.level * 200)}
              intent="success"
              stripes={false}
              animate={false}
            />
            <Tag minimal className="mt-2 text-xs">
              {member.badge}
            </Tag>
          </Card>
        ))}
      </div>
    </div>
  )
}
