import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Emotion, ChatMessage, BoardCard, Theme, FontSize } from '@/types'
import {
  fetchPreferences,
  savePreferences,
  type UserPreferences,
} from '@/api/preferences'

// ── localStorage helpers ──

const LS_KEY = 'odi_preferences'

function loadFromLocalStorage(): Partial<{ theme: Theme; fontSize: FontSize; devMode: boolean }> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function persistToLocalStorage(prefs: { theme: Theme; fontSize: FontSize; devMode: boolean }) {
  localStorage.setItem(LS_KEY, JSON.stringify(prefs))
}

// ── Async thunks for backend sync ──

export const loadPreferencesFromServer = createAsyncThunk(
  'app/loadPreferencesFromServer',
  async () => {
    return await fetchPreferences()
  },
)

export const syncPreferencesToServer = createAsyncThunk(
  'app/syncPreferencesToServer',
  async (prefs: UserPreferences) => {
    return await savePreferences(prefs)
  },
)

// ── Slice ──

const saved = loadFromLocalStorage()

interface AppState {
  devMode: boolean
  theme: Theme
  fontSize: FontSize
  sessionTitle: string
  elapsed: string
  teamOnline: number
  teamSize: number
  energy: number
  currentEmotion: Emotion | null
  messages: ChatMessage[]
  cards: BoardCard[]
  rightPanelCollapsed: boolean
  leftSidebarCollapsed: boolean
}

const initialState: AppState = {
  devMode: saved.devMode ?? false,
  theme: saved.theme ?? 'dark',
  fontSize: saved.fontSize ?? 16,
  sessionTitle: 'Стратегия 2026',
  elapsed: '00:00',
  teamOnline: 4,
  teamSize: 6,
  energy: 7,
  currentEmotion: null,
  messages: [
    {
      id: '1',
      author: 'Модератор',
      role: 'moderator',
      text: 'Добро пожаловать в сессию! Начнем с генерации идей.',
      timestamp: Date.now(),
    },
  ],
  cards: [
    { id: '1', column: 'problems', text: 'Нехватка парковых зон', author: 'Анна', votes: 3 },
    { id: '2', column: 'solutions', text: 'Велодорожки в центре', author: 'Борис', votes: 5 },
    { id: '3', column: 'creative', text: 'Лавочки-зарядки для телефонов', author: 'Визионер', votes: 2 },
  ],
  rightPanelCollapsed: false,
  leftSidebarCollapsed: false,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleDevMode(state) {
      state.devMode = !state.devMode
      persistToLocalStorage({ theme: state.theme, fontSize: state.fontSize, devMode: state.devMode })
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
      persistToLocalStorage({ theme: state.theme, fontSize: state.fontSize, devMode: state.devMode })
    },
    setFontSize(state, action: PayloadAction<FontSize>) {
      state.fontSize = action.payload
      persistToLocalStorage({ theme: state.theme, fontSize: state.fontSize, devMode: state.devMode })
    },
    setEmotion(state, action: PayloadAction<Emotion | null>) {
      state.currentEmotion = action.payload
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload)
    },
    addCard(state, action: PayloadAction<BoardCard>) {
      state.cards.push(action.payload)
    },
    toggleRightPanel(state) {
      state.rightPanelCollapsed = !state.rightPanelCollapsed
    },
    toggleLeftSidebar(state) {
      state.leftSidebarCollapsed = !state.leftSidebarCollapsed
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadPreferencesFromServer.fulfilled, (state, action) => {
      const prefs = action.payload
      if (prefs.theme) state.theme = prefs.theme
      if (prefs.fontSize) state.fontSize = prefs.fontSize
      if (prefs.devMode !== undefined) state.devMode = prefs.devMode
      persistToLocalStorage({ theme: state.theme, fontSize: state.fontSize, devMode: state.devMode })
    })
  },
})

export const {
  toggleDevMode,
  setTheme,
  setFontSize,
  setEmotion,
  addMessage,
  addCard,
  toggleRightPanel,
  toggleLeftSidebar,
} = appSlice.actions
