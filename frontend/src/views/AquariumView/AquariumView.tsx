import { Card, Tag } from '@blueprintjs/core'

const AI_THOUGHTS = [
  {
    bot: 'Модератор',
    thought: 'Команда начинает уставать. Стоит предложить смену формата — перейти от брейншторма к голосованию.',
    confidence: 0.82,
  },
  {
    bot: 'Критик',
    thought: 'Идея с велодорожками популярна, но бюджетно нереалистична. Подготовлю контраргумент.',
    confidence: 0.71,
  },
  {
    bot: 'Визионер',
    thought: 'Можно объединить идеи парка и зарядных лавочек в единую концепцию "зеленых хабов".',
    confidence: 0.65,
  },
]

export function AquariumView() {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-odi-text mb-1">Аквариум: мысли AI</h2>
      <p className="text-sm text-odi-text-muted mb-4">
        Наблюдайте за внутренними рассуждениями AI-агентов в реальном времени
      </p>
      <div className="space-y-4">
        {AI_THOUGHTS.map((item, i) => (
          <Card
            key={i}
            className="!bg-odi-surface-hover !border-odi-border !shadow-none"
          >
            <div className="flex items-center gap-2 mb-2">
              <Tag intent="primary" minimal>
                {item.bot}
              </Tag>
              <span className="text-xs text-odi-text-muted">
                Уверенность: {Math.round(item.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-odi-text italic">"{item.thought}"</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
