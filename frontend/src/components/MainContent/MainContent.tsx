import { useViewMode } from '@/hooks/useViewMode'
import { BoardView } from '@/views/BoardView/BoardView'
import { TheatreView } from '@/views/TheatreView/TheatreView'
import { GraphView } from '@/views/GraphView/GraphView'
import { HQView } from '@/views/HQView/HQView'
import { AquariumView } from '@/views/AquariumView/AquariumView'
import { TerminalView } from '@/views/TerminalView/TerminalView'
import type { ViewMode } from '@/types'

const VIEW_MAP: Record<ViewMode, React.FC> = {
  board: BoardView,
  theatre: TheatreView,
  graph: GraphView,
  hq: HQView,
  aquarium: AquariumView,
  terminal: TerminalView,
}

export function MainContent() {
  const { viewMode } = useViewMode()
  const View = VIEW_MAP[viewMode]

  return (
    <main className="flex-1 overflow-hidden bg-odi-bg">
      <View />
    </main>
  )
}
