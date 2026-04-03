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
  { id: 'moderator', name: 'Модератор', description: 'Ведущий дискуссии', stars: 5, tag: 'популярный' },
  { id: 'critic', name: 'Критик', description: 'Находит слабые стороны', stars: 4 },
  { id: 'visionary', name: 'Визионер', description: 'Генератор идей', stars: 4 },
  { id: 'analyst', name: 'Аналитик', description: 'Цифры и факты', stars: 3 },
  { id: 'peacemaker', name: 'Миротворец', description: 'Компромиссы и эмпатия', stars: 4 },
  { id: 'provocateur', name: 'Провокатор', description: 'Ломает шаблоны', stars: 3 },
  { id: 'keeper', name: 'Хранитель', description: 'Память группы', stars: 4 },
  { id: 'expert', name: 'Эксперт', description: 'Глубокие знания', stars: 5, tag: 'редкий' },
  { id: 'strategist', name: 'Стратег', description: 'Долгосрочные планы', stars: 5, tag: 'редкий' },
  { id: 'coach', name: 'Коуч', description: 'Раскрытие потенциала', stars: 4 },
  { id: 'devil_advocate', name: 'Адвокат дьявола', description: 'Стресс-тест идей', stars: 4 },
  { id: 'innovator', name: 'Инноватор', description: 'Прорывные решения', stars: 5, tag: 'новый' },
]

// ── Session Templates ──

export interface SessionTemplate {
  id: string
  name: string
  description: string
  specialists: SpecialistId[]
  phases: { name: string; durationMinutes: number }[]
  boardColumns: { id: string; title: string }[]
  difficulty: Difficulty
  duration: Duration
  interfaceMode: InterfaceMode
}

export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'brainstorm',
    name: 'Мозговой штурм',
    description: 'Быстрая генерация и отбор идей. Фокус на количестве, а не качестве.',
    specialists: ['moderator', 'visionary', 'provocateur', 'innovator'],
    phases: [
      { name: 'Разогрев', durationMinutes: 5 },
      { name: 'Свободная генерация', durationMinutes: 15 },
      { name: 'Кластеризация идей', durationMinutes: 10 },
      { name: 'Голосование и отбор', durationMinutes: 10 },
      { name: 'Проработка топ-3', durationMinutes: 15 },
    ],
    boardColumns: [
      { id: 'ideas', title: 'Идеи' },
      { id: 'promising', title: 'Перспективные' },
      { id: 'actionable', title: 'К реализации' },
    ],
    difficulty: 'easy',
    duration: 60,
    interfaceMode: 'board',
  },
  {
    id: 'retrospective',
    name: 'Ретроспектива',
    description: 'Анализ прошедшего периода: что прошло хорошо, что плохо, что улучшить.',
    specialists: ['moderator', 'peacemaker', 'analyst', 'coach'],
    phases: [
      { name: 'Сбор данных', durationMinutes: 10 },
      { name: 'Что пошло хорошо', durationMinutes: 10 },
      { name: 'Что пошло плохо', durationMinutes: 10 },
      { name: 'Выводы и действия', durationMinutes: 15 },
    ],
    boardColumns: [
      { id: 'went_well', title: 'Что хорошо' },
      { id: 'went_wrong', title: 'Что плохо' },
      { id: 'actions', title: 'Действия' },
    ],
    difficulty: 'easy',
    duration: 60,
    interfaceMode: 'board',
  },
  {
    id: 'strategy',
    name: 'Стратегическая сессия',
    description: 'Глубокая проработка стратегии: анализ, гипотезы, план действий.',
    specialists: ['moderator', 'strategist', 'critic', 'analyst', 'expert'],
    phases: [
      { name: 'Диагностика текущего состояния', durationMinutes: 15 },
      { name: 'Формулирование гипотез', durationMinutes: 15 },
      { name: 'Стресс-тест гипотез', durationMinutes: 15 },
      { name: 'Выбор стратегии', durationMinutes: 10 },
      { name: 'Дорожная карта', durationMinutes: 15 },
      { name: 'Подведение итогов', durationMinutes: 5 },
    ],
    boardColumns: [
      { id: 'hypotheses', title: 'Гипотезы' },
      { id: 'validated', title: 'Подтверждённые' },
      { id: 'roadmap', title: 'Дорожная карта' },
    ],
    difficulty: 'hard',
    duration: 90,
    interfaceMode: 'chameleon',
  },
  {
    id: 'swot',
    name: 'SWOT-анализ',
    description: 'Структурированный анализ сильных/слабых сторон, возможностей и угроз.',
    specialists: ['moderator', 'analyst', 'critic', 'devil_advocate'],
    phases: [
      { name: 'Сильные стороны (S)', durationMinutes: 10 },
      { name: 'Слабые стороны (W)', durationMinutes: 10 },
      { name: 'Возможности (O)', durationMinutes: 10 },
      { name: 'Угрозы (T)', durationMinutes: 10 },
      { name: 'Стратегические выводы', durationMinutes: 15 },
    ],
    boardColumns: [
      { id: 'strengths', title: 'Сильные стороны' },
      { id: 'weaknesses', title: 'Слабые стороны' },
      { id: 'opportunities', title: 'Возможности' },
      { id: 'threats', title: 'Угрозы' },
    ],
    difficulty: 'medium',
    duration: 60,
    interfaceMode: 'board',
  },
]

// ── Thunks ──

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
  selectedTemplate: string | null
  crewSize: number
  crewSlots: (SpecialistId | null)[]
  difficulty: Difficulty
  duration: Duration
  interfaceMode: InterfaceMode
  aiVisibility: AiVisibility
  phases: { name: string; durationMinutes: number }[]
  boardColumns: { id: string; title: string }[]
}

const initialState: MissionState = {
  scenarios: [],
  scenariosLoading: false,
  title: '',
  selectedScenario: null,
  selectedTemplate: null,
  crewSize: 3,
  crewSlots: [null, null, null],
  difficulty: 'easy',
  duration: 90,
  interfaceMode: 'chameleon',
  aiVisibility: 'captain',
  phases: [],
  boardColumns: [],
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
    applyTemplate(state, action: PayloadAction<string | null>) {
      const templateId = action.payload
      state.selectedTemplate = templateId

      if (!templateId) {
        state.phases = []
        state.boardColumns = []
        return
      }

      const template = SESSION_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return

      state.title = state.title || template.name
      state.difficulty = template.difficulty
      state.duration = template.duration
      state.interfaceMode = template.interfaceMode
      state.phases = template.phases
      state.boardColumns = template.boardColumns

      // Fill crew slots with template specialists
      const size = template.specialists.length
      state.crewSize = size
      state.crewSlots = template.specialists.map((id) => id as SpecialistId)
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
  applyTemplate,
  setCrewSize,
  assignSlot,
  removeFromSlot,
  autoFillCrew,
  setDifficulty,
  setDuration,
  setInterfaceMode,
  setAiVisibility,
} = missionSlice.actions
