import { NonIdealState } from '@blueprintjs/core'

export function GraphView() {
  return (
    <div className="flex items-center justify-center h-full">
      <NonIdealState
        icon="graph"
        title="Граф связей"
        description="Визуализация карты знаний и связей между идеями. Подключите библиотеку визуализации графов (например, react-flow или d3-force)."
      />
    </div>
  )
}
