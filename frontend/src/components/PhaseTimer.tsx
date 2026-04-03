import { useState, useEffect, useRef } from 'react'
import { Timer, ChevronRight } from 'lucide-react'
import { useAppSelector } from '@/store'
import { Progress } from '@/components/ui/progress'
import { showToast } from '@/utils/toaster'
import type { SessionPhase } from '@/store/appSlice'

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PhaseTimer() {
  const phases = useAppSelector((s) => s.app.sessionPhases)
  const activePhase = phases.find((p) => p.status === 'active')
  const [remaining, setRemaining] = useState<number | null>(null)
  const notified5 = useRef(false)
  const notified1 = useRef(false)

  // Calculate remaining time from startedAt + durationMinutes
  useEffect(() => {
    if (!activePhase?.startedAt) {
      setRemaining(null)
      notified5.current = false
      notified1.current = false
      return
    }

    const totalSec = activePhase.durationMinutes * 60
    const startMs = new Date(activePhase.startedAt).getTime()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000)
      const left = Math.max(0, totalSec - elapsed)
      setRemaining(left)

      // Notifications
      if (left <= 300 && left > 295 && !notified5.current) {
        notified5.current = true
        showToast(`Фаза "${activePhase.name}" — осталось 5 минут`, 'warning')
      }
      if (left <= 60 && left > 55 && !notified1.current) {
        notified1.current = true
        showToast(`Фаза "${activePhase.name}" — осталась 1 минута`, 'warning')
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activePhase?.id, activePhase?.startedAt, activePhase?.durationMinutes, activePhase?.name])

  // Reset notifications when phase changes
  useEffect(() => {
    notified5.current = false
    notified1.current = false
  }, [activePhase?.id])

  if (phases.length === 0) return null

  const activeIndex = phases.findIndex((p) => p.status === 'active')
  const totalPhases = phases.length
  const doneCount = phases.filter((p) => p.status === 'done').length

  // Progress percentage within active phase
  const phaseProgress = activePhase && remaining !== null
    ? Math.max(0, 100 - (remaining / (activePhase.durationMinutes * 60)) * 100)
    : 0

  const isOvertime = remaining !== null && remaining <= 0

  return (
    <div className="flex items-center gap-2">
      {/* Phase indicator */}
      <div className="flex items-center gap-1">
        {phases.map((phase, i) => (
          <PhaseIndicator key={phase.id} phase={phase} index={i} isActive={phase.status === 'active'} />
        ))}
      </div>

      {/* Active phase info */}
      {activePhase && (
        <div className="flex items-center gap-2 ml-1">
          <div className="w-px h-4 bg-border" />
          <Timer className={`h-3 w-3 ${isOvertime ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className={`text-xs font-mono font-medium ${isOvertime ? 'text-destructive' : 'text-foreground'}`}>
            {isOvertime ? '+' : ''}{formatRemaining(remaining ?? 0)}
          </span>
          <div className="w-16 hidden sm:block">
            <Progress
              value={phaseProgress}
              className="h-1"
              indicatorClassName={isOvertime ? 'bg-destructive' : undefined}
            />
          </div>
        </div>
      )}

      {/* Counter */}
      {!activePhase && doneCount === totalPhases && (
        <span className="text-xs text-muted-foreground ml-1">Все фазы завершены</span>
      )}
    </div>
  )
}

function PhaseIndicator({ phase, index, isActive }: { phase: SessionPhase; index: number; isActive: boolean }) {
  const color = phase.status === 'done'
    ? 'bg-success'
    : isActive
      ? 'bg-foreground animate-pulse'
      : 'bg-border'

  return (
    <div className="flex items-center" title={`${phase.name} (${phase.durationMinutes} мин)`}>
      <div className={`w-2 h-2 rounded-full ${color}`} />
      {index < 4 && <ChevronRight className="h-2 w-2 text-border mx-0.5" />}
    </div>
  )
}
