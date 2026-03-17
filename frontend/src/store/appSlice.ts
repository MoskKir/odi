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

export interface SessionBot {
  id: string
  specialistId: string
  name: string
  description: string
  stars: number
  tag?: string | null
}

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
  sessionBots: SessionBot[]
  rightPanelCollapsed: boolean
  leftSidebarCollapsed: boolean
  socketJoined: boolean
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
  messages: [],
  cards: [],
  sessionBots: [],
  rightPanelCollapsed: false,
  leftSidebarCollapsed: false,
  socketJoined: false,
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
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload)
    },
    addCard(state, action: PayloadAction<BoardCard>) {
      state.cards.push(action.payload)
    },
    updateSession(state, action: PayloadAction<{ teamOnline?: number; energy?: number }>) {
      const { teamOnline, energy } = action.payload
      if (teamOnline !== undefined) state.teamOnline = teamOnline
      if (energy !== undefined) state.energy = energy
    },
    updatePhase(state, action: PayloadAction<{ phase?: string; elapsed?: string }>) {
      const { elapsed } = action.payload
      if (elapsed !== undefined) state.elapsed = elapsed
    },
    setSessionTitle(state, action: PayloadAction<string>) {
      state.sessionTitle = action.payload
    },
    setSessionBots(state, action: PayloadAction<SessionBot[]>) {
      state.sessionBots = action.payload
    },
    setSocketJoined(state, action: PayloadAction<boolean>) {
      state.socketJoined = action.payload
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
  setMessages,
  addMessage,
  addCard,
  updateSession,
  updatePhase,
  setSocketJoined,
  setSessionTitle,
  setSessionBots,
  toggleRightPanel,
  toggleLeftSidebar,
} = appSlice.actions
