import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const TEAM_STATS = [
  { name: 'Анна', xp: 450, level: 3, badge: 'Генератор идей' },
  { name: 'Борис', xp: 380, level: 2, badge: 'Аналитик' },
  { name: 'Визионер', xp: 600, level: 4, badge: 'AI-помощник' },
  { name: 'Модератор', xp: 520, level: 3, badge: 'Координатор' },
]

export function HQView() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-foreground mb-4">Штаб команды</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEAM_STATS.map((member) => (
          <Card
            key={member.name}
            className="bg-muted border-border shadow-none p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{member.name}</span>
              <Badge variant="outline">
                Lv.{member.level}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              XP: {member.xp} / {member.level * 200}
            </div>
            <Progress
              value={(member.xp / (member.level * 200)) * 100}
              indicatorClassName="bg-success"
            />
            <Badge variant="outline" className="mt-2 text-xs">
              {member.badge}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  )
}
