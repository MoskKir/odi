import { Button, ButtonGroup } from '@blueprintjs/core'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setEmotion } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import type { Emotion } from '@/types'

const EMOTIONS: { emotion: Emotion; emoji: string; label: string }[] = [
  { emotion: 'happy', emoji: '\u{1F60A}', label: 'Радость' },
  { emotion: 'angry', emoji: '\u{1F620}', label: 'Гнев' },
  { emotion: 'calm', emoji: '\u{1F60C}', label: 'Спокойствие' },
  { emotion: 'sad', emoji: '\u{1F622}', label: 'Грусть' },
]

export function EmotionCompass() {
  const currentEmotion = useAppSelector((s) => s.app.currentEmotion)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const handleEmotion = (emotion: Emotion) => {
    const next = currentEmotion === emotion ? null : emotion
    dispatch(setEmotion(next))
    if (sessionId && next) {
      getSocket()?.emit('emotion:set', { sessionId, emotion: next })
    }
  }

  return (
    <div>
      <div className="text-xs text-odi-text-muted uppercase tracking-wider mb-2">
        Эмоции
      </div>
      <ButtonGroup className="gap-1">
        {EMOTIONS.map(({ emotion, emoji, label }) => (
          <Button
            key={emotion}
            minimal
            active={currentEmotion === emotion}
            onClick={() => handleEmotion(emotion)}
            title={label}
            className={
              currentEmotion === emotion
                ? '!bg-odi-accent/20'
                : 'hover:!bg-odi-surface-hover'
            }
          >
            <span className="text-xl">{emoji}</span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
