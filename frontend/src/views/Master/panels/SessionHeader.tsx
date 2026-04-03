import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Users } from 'lucide-react'
import { fetchAdminSessions, type AdminSessionResponse } from '@/api/admin-sessions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'outline'> = {
  active: 'success',
  paused: 'warning',
  completed: 'outline',
  draft: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'LIVE',
  paused: 'ПАУЗА',
  completed: 'ЗАВЕРШЕНА',
  draft: 'ЧЕРНОВИК',
}

export function SessionHeader() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('session')
  const [sessions, setSessions] = useState<AdminSessionResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Load active & paused sessions
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [active, paused, draft] = await Promise.all([
          fetchAdminSessions({ status: 'active', limit: 50 }),
          fetchAdminSessions({ status: 'paused', limit: 50 }),
          fetchAdminSessions({ status: 'draft', limit: 50 }),
        ])
        if (!mounted) return
        const all = [...active.items, ...paused.items, ...draft.items]
        setSessions(all)
        // Auto-select first session if none selected
        if (!selectedId && all.length > 0) {
          setSearchParams({ session: all[0].id }, { replace: true })
        }
      } catch (e) {
        console.error('Failed to load sessions', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const current = sessions.find((s) => s.id === selectedId)

  const onSelect = (id: string) => {
    setSearchParams({ session: id }, { replace: true })
  }

  // Timer based on startedAt
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const startedAt = current?.startedAt ? new Date(current.startedAt).getTime() : null
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  const totalTime = (current?.durationMinutes || 90) * 60
  const progress = totalTime > 0 ? Math.min(elapsed / totalTime, 1) : 0

  const onlineCount = current?.participants?.filter((p) => p.isOnline).length ?? 0
  const totalCount = current?.crewSize ?? 0

  if (loading) {
    return (
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-center shrink-0">
        <Spinner size="sm" />
        <span className="ml-2 text-sm text-muted-foreground">Загрузка сессий...</span>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-center shrink-0">
        <span className="text-sm text-muted-foreground">Нет активных игр</span>
      </div>
    )
  }

  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[current?.status || 'draft'] || 'outline'} className="text-sm">
          {STATUS_LABEL[current?.status || 'draft'] || current?.status}
        </Badge>
        <Select value={selectedId || ''} onValueChange={onSelect}>
          <SelectTrigger className="font-bold text-sm border-none bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} ({STATUS_LABEL[s.status] || s.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Badge variant="outline" className="gap-1">
        <Users className="h-3 w-3" />
        {onlineCount}/{totalCount} онлайн
      </Badge>
      {current?.scenario?.title && <Badge variant="outline">{current.scenario.title}</Badge>}

      <div className="flex-1" />

      {startedAt && (
        <>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-foreground">{time}</span>
            <span className="text-xs text-muted-foreground">
              / {String(Math.floor((current?.durationMinutes || 90) / 60)).padStart(2, '0')}:
              {String((current?.durationMinutes || 90) % 60).padStart(2, '0')}:00
            </span>
          </div>

          <div className="w-32">
            <Progress
              value={progress * 100}
              indicatorClassName={
                progress > 0.85
                  ? 'bg-red-500'
                  : progress > 0.6
                    ? 'bg-yellow-500'
                    : undefined
              }
            />
          </div>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title="Открыть как игрок"
        onClick={() => {
          if (selectedId) window.open(`/game/theatre?session=${selectedId}`, '_blank')
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  )
}
