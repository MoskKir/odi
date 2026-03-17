import { Card, Button } from '@blueprintjs/core'

const ACTIONS = [
  { icon: 'megaphone', label: 'Объявление', intent: 'primary' as const },
  { icon: 'hand', label: 'Тишина', intent: 'warning' as const },
  { icon: 'thumbs-up', label: 'Голосование', intent: 'success' as const },
  { icon: 'time', label: '+5 минут', intent: 'none' as const },
  { icon: 'refresh', label: 'Перемешать', intent: 'none' as const },
  { icon: 'lightning', label: 'Провокация', intent: 'danger' as const },
  { icon: 'heart', label: 'Поддержка', intent: 'success' as const },
  { icon: 'help', label: 'Подсказка', intent: 'primary' as const },
]

export function QuickActions() {
  return (
    <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-3 shrink-0">
      <span className="text-xs font-bold text-odi-text-muted uppercase tracking-wider mb-2 block">
        Быстрые действия
      </span>
      <div className="grid grid-cols-2 gap-1">
        {ACTIONS.map((action) => (
          <Button
            key={action.label}
            icon={action.icon as any}
            text={action.label}
            small
            minimal
            intent={action.intent}
            alignText="left"
            className="!text-xs"
          />
        ))}
      </div>
    </Card>
  )
}
