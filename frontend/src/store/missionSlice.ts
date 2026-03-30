import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type {
  SpecialistId,
  Difficulty,
  Duration,
  InterfaceMode,
  AiVisibility,
  Specialist,
} from '@/types'
import { fetchScenarios, type ScenarioResponse } from '@/api/scenarios'
import { fetchGame } from '@/api/games'

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

export const loadScenarios = createAsyncThunk(
  'mission/loadScenarios',
  async () => {
    return await fetchScenarios()
  },
)

export const loadSession = createAsyncThunk(
  'mission/loadSession',
  async (sessionId: string) => {
    return await fetchGame(sessionId)
  },
)

const MIN_SLOTS = 1

interface MissionState {
  scenarios: ScenarioResponse[]
  scenariosLoading: boolean
  title: string
  selectedScenario: string | null
  crewSize: number
  crewSlots: (SpecialistId | null)[]
  difficulty: Difficulty
  duration: Duration
  interfaceMode: InterfaceMode
  aiVisibility: AiVisibility
}

const initialState: MissionState = {
  scenarios: [],
  scenariosLoading: false,
  title: '',
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
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload
    },
    selectScenario(state, action: PayloadAction<string>) {
      state.selectedScenario = action.payload
    },
    setCrewSize(state, action: PayloadAction<number>) {
      const size = Math.max(MIN_SLOTS, action.payload)
      if (size > state.crewSize) {
        while (state.crewSlots.length < size) state.crewSlots.push(null)
      } else if (size < state.crewSize) {
        state.crewSlots = state.crewSlots.slice(0, size)
      }
      state.crewSize = size
    },
    assignSlot(state, action: PayloadAction<{ slotIndex: number; specialistId: SpecialistId }>) {
      const { slotIndex, specialistId } = action.payload
      if (slotIndex >= 0 && slotIndex < state.crewSize) {
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
      const scenario = state.scenarios.find((s) => s.slug === state.selectedScenario)
      if (!scenario) return
      const toFill = [...(scenario.requiredBots ?? []), ...(scenario.recommendedBots ?? [])]
      const newSlots: (SpecialistId | null)[] = Array(state.crewSize).fill(null)
      toFill.slice(0, state.crewSize).forEach((id, i) => {
        newSlots[i] = id as SpecialistId
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
  extraReducers: (builder) => {
    builder.addCase(loadScenarios.pending, (state) => {
      state.scenariosLoading = true
    })
    builder.addCase(loadScenarios.fulfilled, (state, action) => {
      state.scenariosLoading = false
      state.scenarios = action.payload
    })
    builder.addCase(loadScenarios.rejected, (state) => {
      state.scenariosLoading = false
    })
    builder.addCase(loadSession.fulfilled, (state, action) => {
      const game = action.payload
      if (!game) return
      state.title = game.title || ''
      state.selectedScenario = game.scenario?.slug ?? null
      state.difficulty = (game.difficulty as Difficulty) || 'easy'
      state.duration = (game.durationMinutes as Duration) || 90
      state.interfaceMode = (game.interfaceMode as InterfaceMode) || 'chameleon'
      state.aiVisibility = (game.aiVisibility as AiVisibility) || 'captain'
      // Restore crew from participants
      const botSlots = (game.participants ?? [])
        .filter((p) => p.botConfig)
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((p) => p.botConfig!.specialistId as SpecialistId)
      const crewSize = Math.max(botSlots.length, 1)
      state.crewSize = crewSize
      state.crewSlots = Array(crewSize).fill(null).map((_, i) => botSlots[i] ?? null)
    })
  },
})

export const {
  setTitle,
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
