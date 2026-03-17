import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  ScenarioId,
  SpecialistId,
  Difficulty,
  Duration,
  InterfaceMode,
  AiVisibility,
  Scenario,
  Specialist,
} from '@/types'

export const SCENARIOS: Scenario[] = [
  {
    id: 'business',
    icon: '\u{1F3E2}',
    title: 'БИЗНЕС-СТРАТЕГИЯ',
    subtitle: 'Совет директоров',
    recommended: ['critic', 'analyst'],
    required: ['moderator'],
  },
  {
    id: 'creative',
    icon: '\u{1F4A1}',
    title: 'КРЕАТИВНЫЙ ШТУРМ',
    subtitle: 'Генерация идей',
    recommended: ['visionary', 'provocateur'],
    required: ['moderator'],
  },
  {
    id: 'teambuilding',
    icon: '\u{1F91D}',
    title: 'КОМАНДООБРАЗОВАНИЕ',
    subtitle: 'Работа с конфликтами',
    recommended: ['peacemaker', 'keeper'],
    required: ['moderator'],
  },
]

export const SPECIALISTS: Specialist[] = [
  { id: 'moderator', name: 'Модератор', description: 'Ведущий', stars: 5, tag: 'популярный' },
  { id: 'critic', name: 'Критик', description: 'Оппонент', stars: 4 },
  { id: 'visionary', name: 'Визионер', description: 'Генератор', stars: 4 },
  { id: 'analyst', name: 'Аналитик', description: 'Цифры и факты', stars: 3 },
  { id: 'peacemaker', name: 'Миротворец', description: 'Эмпатия', stars: 4 },
  { id: 'provocateur', name: 'Провокатор', description: 'Будильник', stars: 3 },
  { id: 'keeper', name: 'Хранитель', description: 'Память', stars: 4 },
  { id: 'expert', name: 'Эксперт', description: 'Глубина', stars: 5, tag: 'редкий' },
]

const MIN_SLOTS = 1
const MAX_SLOTS = 7

interface MissionState {
  selectedScenario: ScenarioId | null
  crewSize: number
  crewSlots: (SpecialistId | null)[]
  difficulty: Difficulty
  duration: Duration
  interfaceMode: InterfaceMode
  aiVisibility: AiVisibility
}

const initialState: MissionState = {
  selectedScenario: null,
  crewSize: 3,
  crewSlots: [null, null, null],
  difficulty: 'easy',
  duration: 90,
  interfaceMode: 'chameleon',
  aiVisibility: 'captain',
}

export const missionSlice = createSlice({
  name: 'mission',
  initialState,
  reducers: {
    selectScenario(state, action: PayloadAction<ScenarioId>) {
      state.selectedScenario = action.payload
    },
    setCrewSize(state, action: PayloadAction<number>) {
      const size = Math.max(MIN_SLOTS, Math.min(MAX_SLOTS, action.payload))
      if (size > state.crewSize) {
        // Add empty slots
        while (state.crewSlots.length < size) state.crewSlots.push(null)
      } else if (size < state.crewSize) {
        // Shrink: keep filled slots first, trim from the end
        state.crewSlots = state.crewSlots.slice(0, size)
      }
      state.crewSize = size
    },
    assignSlot(state, action: PayloadAction<{ slotIndex: number; specialistId: SpecialistId }>) {
      const { slotIndex, specialistId } = action.payload
      if (slotIndex >= 0 && slotIndex < state.crewSize) {
        // Remove from other slot if already assigned
        state.crewSlots = state.crewSlots.map((s) => (s === specialistId ? null : s))
        state.crewSlots[slotIndex] = specialistId
      }
    },
    removeFromSlot(state, action: PayloadAction<number>) {
      if (action.payload >= 0 && action.payload < state.crewSize) {
        state.crewSlots[action.payload] = null
      }
    },
    autoFillCrew(state) {
      const scenario = SCENARIOS.find((s) => s.id === state.selectedScenario)
      if (!scenario) return
      const toFill = [...scenario.required, ...scenario.recommended]
      const newSlots: (SpecialistId | null)[] = Array(state.crewSize).fill(null)
      toFill.slice(0, state.crewSize).forEach((id, i) => {
        newSlots[i] = id
      })
      state.crewSlots = newSlots
    },
    setDifficulty(state, action: PayloadAction<Difficulty>) {
      state.difficulty = action.payload
    },
    setDuration(state, action: PayloadAction<Duration>) {
      state.duration = action.payload
    },
    setInterfaceMode(state, action: PayloadAction<InterfaceMode>) {
      state.interfaceMode = action.payload
    },
    setAiVisibility(state, action: PayloadAction<AiVisibility>) {
      state.aiVisibility = action.payload
    },
  },
})

export const {
  selectScenario,
  setCrewSize,
  assignSlot,
  removeFromSlot,
  autoFillCrew,
  setDifficulty,
  setDuration,
  setInterfaceMode,
  setAiVisibility,
} = missionSlice.actions
