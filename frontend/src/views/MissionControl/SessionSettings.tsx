import { Radio, RadioGroup } from '@blueprintjs/core'
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
      <div className="bg-odi-surface rounded-lg border border-odi-border p-4 space-y-4">
        <RadioGroup
          label="Сложность"
          inline
          onChange={(e) => dispatch(setDifficulty(e.currentTarget.value as Difficulty))}
          selectedValue={difficulty}
          className="!text-odi-text-muted !text-sm [&_.bp5-label]:!text-odi-text-muted"
        >
          <Radio label="Легкая (обучение)" value="easy" />
          <Radio label="Средняя" value="medium" />
          <Radio label="Сложная (эксперт)" value="hard" />
        </RadioGroup>

        <RadioGroup
          label="Длительность"
          inline
          onChange={(e) => dispatch(setDuration(Number(e.currentTarget.value) as Duration))}
          selectedValue={String(duration)}
          className="!text-odi-text-muted !text-sm [&_.bp5-label]:!text-odi-text-muted"
        >
          <Radio label="30 мин" value="30" />
          <Radio label="60 мин" value="60" />
          <Radio label="90 мин" value="90" />
          <Radio label="Без лимита" value="0" />
        </RadioGroup>

        <RadioGroup
          label="Режим интерфейса"
          inline
          onChange={(e) => dispatch(setInterfaceMode(e.currentTarget.value as InterfaceMode))}
          selectedValue={interfaceMode}
          className="!text-odi-text-muted !text-sm [&_.bp5-label]:!text-odi-text-muted"
        >
          <Radio label="Хамелеон (адаптивный)" value="chameleon" />
          <Radio label="Доска" value="board" />
          <Radio label="Театр" value="theatre" />
          <Radio label="Терминал" value="terminal" />
        </RadioGroup>

        <RadioGroup
          label="Видимость AI-мыслей"
          inline
          onChange={(e) => dispatch(setAiVisibility(e.currentTarget.value as AiVisibility))}
          selectedValue={aiVisibility}
          className="!text-odi-text-muted !text-sm [&_.bp5-label]:!text-odi-text-muted"
        >
          <Radio label="Скрыты" value="hidden" />
          <Radio label="Только капитан" value="captain" />
          <Radio label="Вся команда" value="team" />
        </RadioGroup>
      </div>
    </div>
  )
}
