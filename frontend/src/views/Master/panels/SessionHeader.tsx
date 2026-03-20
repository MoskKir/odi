import { Tag, ProgressBar, Button, HTMLSelect, Spinner } from '@blueprintjs/core'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchAdminSessions, type AdminSessionResponse } from '@/api/admin-sessions'

const STATUS_INTENT: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'none'> = {
  active: 'success',
  paused: 'warning',
  completed: 'none',
  draft: 'primary',
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
      <div className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center justify-center shrink-0">
        <Spinner size={16} />
        <span className="ml-2 text-sm text-odi-text-muted">Загрузка сессий...</span>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-odi-surface border-b border-odi-border px-4 py-3 flex items-center justify-center shrink-0">
        <span className="text-sm text-odi-text-muted">Нет активных игр</span>
      </div>
    )
  }

  return (
    <div className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <Tag intent={STATUS_INTENT[current?.status || 'draft'] || 'none'} large>
          {STATUS_LABEL[current?.status || 'draft'] || current?.status}
        </Tag>
        <HTMLSelect
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          minimal
          className="font-bold text-sm"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({STATUS_LABEL[s.status] || s.status})
            </option>
          ))}
        </HTMLSelect>
      </div>

      <Tag minimal icon="people">{onlineCount}/{totalCount} онлайн</Tag>
      {current?.scenario?.title && <Tag minimal>{current.scenario.title}</Tag>}

      <div className="flex-1" />

      {startedAt && (
        <>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-odi-text">{time}</span>
            <span className="text-xs text-odi-text-muted">
              / {String(Math.floor((current?.durationMinutes || 90) / 60)).padStart(2, '0')}:
              {String((current?.durationMinutes || 90) % 60).padStart(2, '0')}:00
            </span>
          </div>

          <div className="w-32">
            <ProgressBar
              value={progress}
              intent={progress > 0.85 ? 'danger' : progress > 0.6 ? 'warning' : 'primary'}
              stripes={false}
              animate={false}
            />
          </div>
        </>
      )}

      <Button
        icon="eye-open"
        small
        minimal
        title="Открыть как игрок"
        onClick={() => {
          if (selectedId) window.open(`/game/theatre?session=${selectedId}`, '_blank')
        }}
      />
    </div>
  )
}
