import { HTMLSelect } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import {
  setDifficulty,
  setDuration,
  setInterfaceMode,
  setAiVisibility,
} from '@/store/missionSlice'
import type { Difficulty, Duration, InterfaceMode, AiVisibility } from '@/types'

export function SessionSettings() {
  const { difficulty, duration, interfaceMode, aiVisibility } = useAppSelector(
    (s) => s.mission,
  )
  const dispatch = useAppDispatch()

  return (
    <div>
      <div className="text-sm font-bold text-odi-text-muted mb-3">
        {'\u2699\uFE0F'} НАСТРОЙКИ СЕССИИ
      </div>
      <div className="bg-odi-surface rounded-lg border border-odi-border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-odi-text-muted block mb-1">Сложность</label>
          <HTMLSelect
            value={difficulty}
            onChange={(e) => dispatch(setDifficulty(e.currentTarget.value as Difficulty))}
            fill
            className="!text-sm"
          >
            <option value="easy">Легкая (обучение)</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная (эксперт)</option>
          </HTMLSelect>
        </div>
        <div>
          <label className="text-xs text-odi-text-muted block mb-1">Длительность</label>
          <HTMLSelect
            value={String(duration)}
            onChange={(e) => dispatch(setDuration(Number(e.currentTarget.value) as Duration))}
            fill
            className="!text-sm"
          >
            <option value="30">30 мин</option>
            <option value="60">60 мин</option>
            <option value="90">90 мин</option>
            <option value="0">Без лимита</option>
          </HTMLSelect>
        </div>
        <div>
          <label className="text-xs text-odi-text-muted block mb-1">Интерфейс</label>
          <HTMLSelect
            value={interfaceMode}
            onChange={(e) => dispatch(setInterfaceMode(e.currentTarget.value as InterfaceMode))}
            fill
            className="!text-sm"
          >
            <option value="chameleon">Хамелеон (адаптивный)</option>
            <option value="board">Доска</option>
            <option value="theatre">Театр</option>
            <option value="terminal">Терминал</option>
          </HTMLSelect>
        </div>
        <div>
          <label className="text-xs text-odi-text-muted block mb-1">AI-мысли</label>
          <HTMLSelect
            value={aiVisibility}
            onChange={(e) => dispatch(setAiVisibility(e.currentTarget.value as AiVisibility))}
            fill
            className="!text-sm"
          >
            <option value="hidden">Скрыты</option>
            <option value="captain">Только капитан</option>
            <option value="team">Вся команда</option>
          </HTMLSelect>
        </div>
      </div>
    </div>
  )
}
