import { Network } from 'lucide-react'

export function GraphView() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <Network className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Граф связей</h2>
        <p className="text-sm text-muted-foreground">
          Визуализация карты знаний и связей между идеями. Подключите библиотеку визуализации графов (например, react-flow или d3-force).
        </p>
      </div>
    </div>
  )
}
