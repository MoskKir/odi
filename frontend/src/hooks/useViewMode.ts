import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import type { ViewMode } from '@/types'

const VALID_MODES: ViewMode[] = ['board', 'theatre', 'graph', 'hq', 'aquarium', 'terminal']

export function useViewMode() {
  const { viewMode } = useParams<{ viewMode: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const current: ViewMode = VALID_MODES.includes(viewMode as ViewMode)
    ? (viewMode as ViewMode)
    : 'board'

  const setViewMode = (mode: ViewMode) => {
    const qs = searchParams.toString()
    navigate(`/game/${mode}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  return { viewMode: current, setViewMode }
}
