import { useParams, useNavigate } from 'react-router-dom'
import type { ViewMode } from '@/types'

const VALID_MODES: ViewMode[] = ['board', 'theatre', 'graph', 'hq', 'aquarium', 'terminal']

export function useViewMode() {
  const { viewMode } = useParams<{ viewMode: string }>()
  const navigate = useNavigate()

  const current: ViewMode = VALID_MODES.includes(viewMode as ViewMode)
    ? (viewMode as ViewMode)
    : 'board'

  const setViewMode = (mode: ViewMode) => {
    navigate(`/game/${mode}`, { replace: true })
  }

  return { viewMode: current, setViewMode }
}
