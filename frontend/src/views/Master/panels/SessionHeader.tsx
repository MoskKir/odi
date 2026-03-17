import { Tag, ProgressBar, Button } from '@blueprintjs/core'
import { useState, useEffect } from 'react'

export function SessionHeader() {
  const [seconds, setSeconds] = useState(4965) // 01:22:45
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [paused])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  const totalTime = 90 * 60
  const progress = Math.min(seconds / totalTime, 1)

  return (
    <div className="bg-odi-surface border-b border-odi-border px-4 py-2 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-2">
        <Tag intent="success" large>LIVE</Tag>
        <span className="font-bold text-odi-text">Стратегия развития 2026</span>
      </div>

      <Tag minimal icon="people">4/6 онлайн</Tag>
      <Tag minimal>Бизнес-стратегия</Tag>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-bold text-odi-text">{time}</span>
        <span className="text-xs text-odi-text-muted">/ 01:30:00</span>
      </div>

      <div className="w-32">
        <ProgressBar
          value={progress}
          intent={progress > 0.85 ? 'danger' : progress > 0.6 ? 'warning' : 'primary'}
          stripes={false}
          animate={false}
        />
      </div>

      <Button
        icon={paused ? 'play' : 'pause'}
        intent={paused ? 'success' : 'warning'}
        small
        onClick={() => setPaused(!paused)}
      />
      <Button icon="stop" intent="danger" small outlined />
    </div>
  )
}
