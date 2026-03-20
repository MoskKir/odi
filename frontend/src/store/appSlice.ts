import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Emotion, ChatMessage, BoardCard, Theme, FontSize } from '@/types'
import {
  fetchPreferences,
  savePreferences,
  type UserPreferences,
} from '@/api/preferences'

// ── localStorage helpers ──

const LS_KEY = 'odi_preferences'

interface PersistedPrefs {
  theme: Theme
  fontSize: FontSize
  devMode: boolean
  leftSidebarCollapsed: boolean
  leftSidebarWidth: number
  rightPanelCollapsed: boolean
  rightPanelWidth: number
  inputBarHeight: number
}

function loadFromLocalStorage(): Partial<PersistedPrefs> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function persistToLocalStorage(prefs: PersistedPrefs) {
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

export interface SessionParticipant {
  id: string
  role: string
  isOnline: boolean
  contributionsCount: number
  currentEmotion?: string | null
  userName?: string
  botConfigId?: string
  botName?: string
  botSpecialistId?: string
}

interface StreamingMessage {
  streamId: string
  botConfigId: string
  text: string
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
  streamingMessages: Record<string, StreamingMessage>
  cards: BoardCard[]
  sessionBots: SessionBot[]
  sessionParticipants: SessionParticipant[]
  rightPanelCollapsed: boolean
  rightPanelWidth: number
  leftSidebarCollapsed: boolean
  leftSidebarWidth: number
  inputBarHeight: number
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
  streamingMessages: {},
  cards: [],
  sessionBots: [],
  sessionParticipants: [],
  rightPanelCollapsed: saved.rightPanelCollapsed ?? false,
  rightPanelWidth: saved.rightPanelWidth ?? 256,
  leftSidebarCollapsed: saved.leftSidebarCollapsed ?? false,
  leftSidebarWidth: saved.leftSidebarWidth ?? 208,
  inputBarHeight: saved.inputBarHeight ?? 36,
  socketJoined: false,
}

function getPersistedPrefs(state: AppState): PersistedPrefs {
  return {
    theme: state.theme,
    fontSize: state.fontSize,
    devMode: state.devMode,
    leftSidebarCollapsed: state.leftSidebarCollapsed,
    leftSidebarWidth: state.leftSidebarWidth,
    rightPanelCollapsed: state.rightPanelCollapsed,
    rightPanelWidth: state.rightPanelWidth,
    inputBarHeight: state.inputBarHeight,
  }
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleDevMode(state) {
      state.devMode = !state.devMode
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setFontSize(state, action: PayloadAction<FontSize>) {
      state.fontSize = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setEmotion(state, action: PayloadAction<Emotion | null>) {
      state.currentEmotion = action.payload
    },
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      // If this message replaces a streaming message, remove the stream
      const streamId = Object.keys(state.streamingMessages).find(
        (sid) => state.streamingMessages[sid].text === action.payload.text,
      )
      if (streamId) {
        delete state.streamingMessages[streamId]
      }
      state.messages.push(action.payload)
    },
    startStream(state, action: PayloadAction<{ streamId: string; botConfigId: string }>) {
      state.streamingMessages[action.payload.streamId] = {
        streamId: action.payload.streamId,
        botConfigId: action.payload.botConfigId,
        text: '',
      }
    },
    appendStreamChunk(state, action: PayloadAction<{ streamId: string; content: string }>) {
      const stream = state.streamingMessages[action.payload.streamId]
      if (stream) {
        stream.text += action.payload.content
      }
    },
    endStream(state, action: PayloadAction<{ streamId: string }>) {
      delete state.streamingMessages[action.payload.streamId]
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
    setSessionParticipants(state, action: PayloadAction<SessionParticipant[]>) {
      state.sessionParticipants = action.payload
    },
    setSocketJoined(state, action: PayloadAction<boolean>) {
      state.socketJoined = action.payload
    },
    toggleRightPanel(state) {
      state.rightPanelCollapsed = !state.rightPanelCollapsed
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setRightPanelWidth(state, action: PayloadAction<number>) {
      state.rightPanelWidth = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    toggleLeftSidebar(state) {
      state.leftSidebarCollapsed = !state.leftSidebarCollapsed
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setLeftSidebarWidth(state, action: PayloadAction<number>) {
      state.leftSidebarWidth = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setInputBarHeight(state, action: PayloadAction<number>) {
      state.inputBarHeight = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadPreferencesFromServer.fulfilled, (state, action) => {
      const prefs = action.payload
      if (prefs.theme) state.theme = prefs.theme
      if (prefs.fontSize) state.fontSize = prefs.fontSize
      if (prefs.devMode !== undefined) state.devMode = prefs.devMode
      if (prefs.leftSidebarCollapsed !== undefined) state.leftSidebarCollapsed = prefs.leftSidebarCollapsed
      if (prefs.leftSidebarWidth) state.leftSidebarWidth = prefs.leftSidebarWidth
      if (prefs.rightPanelCollapsed !== undefined) state.rightPanelCollapsed = prefs.rightPanelCollapsed
      if (prefs.rightPanelWidth) state.rightPanelWidth = prefs.rightPanelWidth
      if (prefs.inputBarHeight) state.inputBarHeight = prefs.inputBarHeight
      persistToLocalStorage(getPersistedPrefs(state))
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
  startStream,
  appendStreamChunk,
  endStream,
  addCard,
  updateSession,
  updatePhase,
  setSocketJoined,
  setSessionTitle,
  setSessionBots,
  setSessionParticipants,
  toggleRightPanel,
  setRightPanelWidth,
  toggleLeftSidebar,
  setLeftSidebarWidth,
  setInputBarHeight,
} = appSlice.actions
