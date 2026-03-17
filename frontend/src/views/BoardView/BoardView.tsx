import { Card, Tag, Button } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

const COLUMNS = [
  { id: 'problems', title: 'Проблемы', color: 'text-odi-danger' },
  { id: 'solutions', title: 'Решения', color: 'text-odi-success' },
  { id: 'creative', title: 'Креатив', color: 'text-odi-energy' },
]

export function BoardView() {
  const cards = useAppSelector((s) => s.app.cards)

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {COLUMNS.map((col) => (
        <div key={col.id} className="flex-1 min-w-[250px] flex flex-col gap-2">
          <div className={`text-sm font-bold uppercase tracking-wider ${col.color} mb-2`}>
            {col.title}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {cards
              .filter((c) => c.column === col.id)
              .map((card) => (
                <Card
                  key={card.id}
                  interactive
                  className="!bg-odi-surface-hover !border-odi-border !shadow-none"
                >
                  <p className="text-sm text-odi-text mb-2">{card.text}</p>
                  <div className="flex items-center justify-between">
                    <Tag minimal className="text-xs">
                      {card.author}
                    </Tag>
                    <Button
                      icon="thumbs-up"
                      minimal
                      small
                      className="!text-odi-text-muted"
                    >
                      {card.votes}
                    </Button>
                  </div>
                </Card>
              ))}
            <Button
              icon="plus"
              minimal
              className="!text-odi-text-muted hover:!text-odi-text mt-1"
              text="Добавить"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
