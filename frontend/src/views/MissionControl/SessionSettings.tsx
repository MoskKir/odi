import { Settings } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  setDifficulty,
  setDuration,
  setInterfaceMode,
  setAiVisibility,
} from '@/store/missionSlice'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { Difficulty, Duration, InterfaceMode, AiVisibility } from '@/types'

export function SessionSettings() {
  const { difficulty, duration, interfaceMode, aiVisibility } = useAppSelector(
    (s) => s.mission,
  )
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground mb-3">
        <Settings className="h-3.5 w-3.5" />
        НАСТРОЙКИ СЕССИИ
      </div>
      <div className="bg-card rounded-lg border border-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Сложность</label>
          <Select
            value={difficulty}
            onValueChange={(val) => dispatch(setDifficulty(val as Difficulty))}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Легкая (обучение)</SelectItem>
              <SelectItem value="medium">Средняя</SelectItem>
              <SelectItem value="hard">Сложная (эксперт)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Длительность</label>
          <Select
            value={String(duration)}
            onValueChange={(val) => dispatch(setDuration(Number(val) as Duration))}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 мин</SelectItem>
              <SelectItem value="60">60 мин</SelectItem>
              <SelectItem value="90">90 мин</SelectItem>
              <SelectItem value="0">Без лимита</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Интерфейс</label>
          <Select
            value={interfaceMode}
            onValueChange={(val) => dispatch(setInterfaceMode(val as InterfaceMode))}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chameleon">Хамелеон (адаптивный)</SelectItem>
              <SelectItem value="board">Доска</SelectItem>
              <SelectItem value="theatre">Театр</SelectItem>
              <SelectItem value="terminal">Терминал</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">AI-мысли</label>
          <Select
            value={aiVisibility}
            onValueChange={(val) => dispatch(setAiVisibility(val as AiVisibility))}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hidden">Скрыты</SelectItem>
              <SelectItem value="captain">Только капитан</SelectItem>
              <SelectItem value="team">Вся команда</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
