import { useState, useEffect, useRef } from 'react'
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
  const [displayedMode, setDisplayedMode] = useState(viewMode)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayedMode(viewMode)
      return
    }

    if (viewMode !== displayedMode) {
      setPhase('out')
      const timeout = setTimeout(() => {
        setDisplayedMode(viewMode)
        setPhase('in')
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [viewMode])

  const View = VIEW_MAP[displayedMode]

  return (
    <main className="flex-1 overflow-hidden bg-background">
      <div
        className={`h-full transition-all duration-150 ease-in-out ${
          phase === 'out'
            ? 'opacity-0 scale-[0.98]'
            : 'opacity-100 scale-100'
        }`}
      >
        <View />
      </div>
    </main>
  )
}
