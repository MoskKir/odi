import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { setEmotion } from '@/store/appSlice'
import { getSocket } from '@/api/socket'
import { Smile, Flame, CloudSun, CloudRain, type LucideIcon } from 'lucide-react'
import type { Emotion } from '@/types'

const EMOTIONS: { emotion: Emotion; icon: LucideIcon; label: string }[] = [
  { emotion: 'happy', icon: Smile, label: 'Радость' },
  { emotion: 'angry', icon: Flame, label: 'Гнев' },
  { emotion: 'calm', icon: CloudSun, label: 'Спокойствие' },
  { emotion: 'sad', icon: CloudRain, label: 'Грусть' },
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
    <div className="flex gap-1 w-full">
      {EMOTIONS.map(({ emotion, icon: Icon, label }) => (
        <Button
          key={emotion}
          variant="ghost"
          onClick={() => handleEmotion(emotion)}
          title={label}
          className={`flex-1 ${
            currentEmotion === emotion
              ? 'bg-accent hover:bg-accent'
              : 'hover:bg-muted'
          }`}
        >
          <Icon className="h-5 w-5" />
        </Button>
      ))}
    </div>
  )
}
