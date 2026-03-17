import { Card, Tag, Button } from '@blueprintjs/core'

interface ScenarioRow {
  id: string
  icon: string
  title: string
  description: string
  requiredBots: string[]
  sessionsCount: number
  avgDuration: string
  difficulty: 'easy' | 'medium' | 'hard'
  published: boolean
}

const MOCK_SCENARIOS: ScenarioRow[] = [
  { id: '1', icon: '\u{1F3E2}', title: 'Бизнес-стратегия', description: 'Совет директоров: стратегические решения и планирование', requiredBots: ['Модератор', 'Критик', 'Аналитик'], sessionsCount: 89, avgDuration: '01:15', difficulty: 'hard', published: true },
  { id: '2', icon: '\u{1F4A1}', title: 'Креативный штурм', description: 'Генерация и проработка инновационных идей', requiredBots: ['Модератор', 'Визионер', 'Провокатор'], sessionsCount: 124, avgDuration: '00:55', difficulty: 'easy', published: true },
  { id: '3', icon: '\u{1F91D}', title: 'Командообразование', description: 'Работа с конфликтами и укрепление команды', requiredBots: ['Модератор', 'Миротворец', 'Хранитель'], sessionsCount: 67, avgDuration: '01:30', difficulty: 'medium', published: true },
  { id: '4', icon: '\u{1F3AF}', title: 'Питч инвестору', description: 'Подготовка и защита бизнес-предложения', requiredBots: ['Модератор', 'Критик', 'Эксперт'], sessionsCount: 34, avgDuration: '01:00', difficulty: 'hard', published: true },
  { id: '5', icon: '\u{1F52C}', title: 'Исследование проблемы', description: 'Глубокий анализ корневых причин', requiredBots: ['Модератор', 'Аналитик'], sessionsCount: 0, avgDuration: '--:--', difficulty: 'medium', published: false },
]

const DIFF_CONFIG: Record<string, { label: string; intent: 'success' | 'warning' | 'danger' }> = {
  easy: { label: 'Лёгкий', intent: 'success' },
  medium: { label: 'Средний', intent: 'warning' },
  hard: { label: 'Сложный', intent: 'danger' },
}

export function ScenariosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Сценарии</h2>
        <Button icon="plus" intent="success" text="Новый сценарий" />
      </div>

      <div className="space-y-3">
        {MOCK_SCENARIOS.map((scenario) => {
          const diff = DIFF_CONFIG[scenario.difficulty]
          return (
            <Card key={scenario.id} className="!bg-odi-surface !border-odi-border !shadow-none">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{scenario.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-odi-text">{scenario.title}</span>
                    <Tag intent={diff.intent} minimal round className="text-[10px]">{diff.label}</Tag>
                    {!scenario.published && <Tag minimal intent="warning" className="text-[10px]">Черновик</Tag>}
                  </div>
                  <div className="text-sm text-odi-text-muted mb-2">{scenario.description}</div>
                  <div className="flex items-center gap-4 text-xs text-odi-text-muted">
                    <span>Боты: {scenario.requiredBots.join(', ')}</span>
                    <span>{scenario.sessionsCount} сессий</span>
                    <span>Ср. длительность: {scenario.avgDuration}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button icon="edit" minimal small title="Редактировать" />
                  <Button icon="duplicate" minimal small title="Дублировать" />
                  <Button icon="trash" minimal small intent="danger" title="Удалить" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
