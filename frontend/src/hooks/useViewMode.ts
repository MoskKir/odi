import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { setActiveViewMode } from '@/store/appSlice'
import type { ViewMode } from '@/types'

const VALID_MODES: ViewMode[] = ['board', 'theatre', 'graph', 'hq', 'aquarium', 'terminal']

export function useViewMode() {
  const { viewMode } = useParams<{ viewMode: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const savedViewMode = useAppSelector((s) => s.app.activeViewMode)

  const current: ViewMode = VALID_MODES.includes(viewMode as ViewMode)
    ? (viewMode as ViewMode)
    : 'board'

  // Persist active view mode on change
  useEffect(() => {
    if (current !== savedViewMode) {
      dispatch(setActiveViewMode(current))
    }
  }, [current, savedViewMode, dispatch])

  // Restore saved view mode on initial load (when URL has default)
  useEffect(() => {
    if (
      savedViewMode &&
      VALID_MODES.includes(savedViewMode as ViewMode) &&
      savedViewMode !== current &&
      viewMode === current // only redirect if URL wasn't explicitly set to something else
    ) {
      const qs = searchParams.toString()
      navigate(`/game/${savedViewMode}${qs ? `?${qs}` : ''}`, { replace: true })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setViewMode = (mode: ViewMode) => {
    dispatch(setActiveViewMode(mode))
    const qs = searchParams.toString()
    navigate(`/game/${mode}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  return { viewMode: current, setViewMode }
}
