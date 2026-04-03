import {
  Megaphone,
  Hand,
  ThumbsUp,
  Clock,
  RefreshCw,
  Zap,
  Heart,
  HelpCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ACTIONS = [
  { icon: Megaphone, label: 'Объявление', variant: 'default' as const },
  { icon: Hand, label: 'Тишина', className: 'text-yellow-500 hover:text-yellow-600' },
  { icon: ThumbsUp, label: 'Голосование', className: 'text-green-500 hover:text-green-600' },
  { icon: Clock, label: '+5 минут' },
  { icon: RefreshCw, label: 'Перемешать' },
  { icon: Zap, label: 'Провокация', className: 'text-red-500 hover:text-red-600' },
  { icon: Heart, label: 'Поддержка', className: 'text-green-500 hover:text-green-600' },
  { icon: HelpCircle, label: 'Подсказка', variant: 'default' as const },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border shadow-none p-3 shrink-0">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
        Быстрые действия
      </span>
      <div className="grid grid-cols-2 gap-1">
        {ACTIONS.map((action) => {
          const IconComp = action.icon
          return (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className={`justify-start gap-2 text-xs ${action.className || ''}`}
            >
              <IconComp className="h-3.5 w-3.5 shrink-0" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
