import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Emotion, ChatMessage, BoardCard, Theme, FontSize } from '@/types'
import {
  fetchPreferences,
  savePreferences,
  type UserPreferences,
  type RightPanelSections,
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
  rightPanelSections: RightPanelSections
  masterHintsPanelCollapsed: boolean
  masterHintsPanelWidth: number
  boardColumnWidths: number[] | null
  aquariumFocusedBotId: string | null
  aquariumBotTabs: Record<string, string>
  activeViewMode: string | null
  dashboardView: string
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
  reflectionPrompt?: string | null
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
  scenarioInfo: { title: string; subtitle: string; description: string; icon: string } | null
  elapsed: string
  teamOnline: number
  teamSize: number
  energy: number
  currentEmotion: Emotion | null
  messages: ChatMessage[]
  streamingMessages: Record<string, StreamingMessage>
  /** StreamIds to ignore (after user stopped generation) */
  ignoredStreamIds: Record<string, true>
  /** Timestamp until which new streams are blocked */
  _stopGenerationUntil: number
  cards: BoardCard[]
  sessionBots: SessionBot[]
  sessionParticipants: SessionParticipant[]
  sessionBoardColumns: { id: string; title: string }[] | null
  rightPanelCollapsed: boolean
  rightPanelWidth: number
  rightPanelSections: RightPanelSections
  leftSidebarCollapsed: boolean
  leftSidebarWidth: number
  inputBarHeight: number
  masterHintsPanelCollapsed: boolean
  masterHintsPanelWidth: number
  boardColumnWidths: number[] | null
  socketJoined: boolean
  inviteCode: string | null
  quickAddCard: boolean
  editingMessage: { id: string; text: string } | null
  pendingMention: string | null
  aquariumFocusedBotId: string | null
  aquariumBotTabs: Record<string, string>
  activeViewMode: string | null
  dashboardView: string
}

const initialState: AppState = {
  devMode: saved.devMode ?? false,
  theme: saved.theme ?? 'dark',
  fontSize: saved.fontSize ?? 16,
  sessionTitle: 'Стратегия 2026',
  scenarioInfo: null,
  elapsed: '00:00',
  teamOnline: 4,
  teamSize: 6,
  energy: 7,
  currentEmotion: null,
  messages: [],
  streamingMessages: {},
  ignoredStreamIds: {},
  _stopGenerationUntil: 0,
  cards: [],
  sessionBots: [],
  sessionParticipants: [],
  sessionBoardColumns: null,
  rightPanelCollapsed: saved.rightPanelCollapsed ?? false,
  rightPanelWidth: saved.rightPanelWidth ?? 256,
  rightPanelSections: saved.rightPanelSections ?? { scenario: true, emotion: true, meta: true, bots: true, chat: true },
  leftSidebarCollapsed: saved.leftSidebarCollapsed ?? false,
  leftSidebarWidth: saved.leftSidebarWidth ?? 208,
  inputBarHeight: saved.inputBarHeight ?? 36,
  masterHintsPanelCollapsed: saved.masterHintsPanelCollapsed ?? false,
  masterHintsPanelWidth: saved.masterHintsPanelWidth ?? 288,
  boardColumnWidths: saved.boardColumnWidths ?? null,
  socketJoined: false,
  inviteCode: null,
  quickAddCard: false,
  editingMessage: null,
  pendingMention: null,
  aquariumFocusedBotId: saved.aquariumFocusedBotId ?? null,
  aquariumBotTabs: saved.aquariumBotTabs ?? {},
  activeViewMode: saved.activeViewMode ?? null,
  dashboardView: saved.dashboardView ?? 'table',
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
    rightPanelSections: state.rightPanelSections,
    inputBarHeight: state.inputBarHeight,
    masterHintsPanelCollapsed: state.masterHintsPanelCollapsed,
    masterHintsPanelWidth: state.masterHintsPanelWidth,
    boardColumnWidths: state.boardColumnWidths,
    aquariumFocusedBotId: state.aquariumFocusedBotId,
    aquariumBotTabs: state.aquariumBotTabs,
    activeViewMode: state.activeViewMode,
    dashboardView: state.dashboardView,
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
      if (state.ignoredStreamIds[action.payload.streamId]) return
      // Block new streams that arrive after stopAllStreams for 5s
      if (state._stopGenerationUntil && Date.now() < state._stopGenerationUntil) {
        state.ignoredStreamIds[action.payload.streamId] = true
        return
      }
      state.streamingMessages[action.payload.streamId] = {
        streamId: action.payload.streamId,
        botConfigId: action.payload.botConfigId,
        text: '',
      }
    },
    appendStreamChunk(state, action: PayloadAction<{ streamId: string; content: string }>) {
      if (state.ignoredStreamIds[action.payload.streamId]) return
      const stream = state.streamingMessages[action.payload.streamId]
      if (stream) {
        stream.text += action.payload.content
      }
    },
    endStream(state, action: PayloadAction<{ streamId: string; stopped?: boolean }>) {
      delete state.ignoredStreamIds[action.payload.streamId]
      const stream = state.streamingMessages[action.payload.streamId]
      if (stream && action.payload.stopped && stream.text.trim()) {
        const bot = state.sessionBots.find((b) => b.id === stream.botConfigId)
        state.messages.push({
          id: `stopped-${action.payload.streamId}`,
          author: bot?.name ?? 'Bot',
          role: 'bot',
          text: stream.text,
          timestamp: Date.now(),
        })
      }
      delete state.streamingMessages[action.payload.streamId]
    },
    /** Immediately stop all active streams on the frontend */
    stopAllStreams(state) {
      // Block new streams for 5 seconds
      state._stopGenerationUntil = Date.now() + 5000
      for (const [streamId, stream] of Object.entries(state.streamingMessages)) {
        state.ignoredStreamIds[streamId] = true
        if (stream.text.trim()) {
          const bot = state.sessionBots.find((b) => b.id === stream.botConfigId)
          state.messages.push({
            id: `stopped-${streamId}`,
            author: bot?.name ?? 'Bot',
            role: 'bot',
            text: stream.text,
            timestamp: Date.now(),
          })
        }
      }
      state.streamingMessages = {}
    },
    editMessage(state, action: PayloadAction<{ id: string; text: string; isEdited?: boolean }>) {
      const msg = state.messages.find((m) => m.id === action.payload.id)
      if (msg) {
        msg.text = action.payload.text
        msg.isEdited = action.payload.isEdited ?? true
      }
    },
    deleteMessage(state, action: PayloadAction<string>) {
      state.messages = state.messages.filter((m) => m.id !== action.payload)
    },
    setCards(state, action: PayloadAction<BoardCard[]>) {
      state.cards = action.payload
    },
    addCard(state, action: PayloadAction<BoardCard>) {
      state.cards.push(action.payload)
    },
    updateCard(state, action: PayloadAction<BoardCard>) {
      const idx = state.cards.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) state.cards[idx] = action.payload
    },
    removeCard(state, action: PayloadAction<string>) {
      state.cards = state.cards.filter((c) => c.id !== action.payload)
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
    setScenarioInfo(state, action: PayloadAction<AppState['scenarioInfo']>) {
      state.scenarioInfo = action.payload
    },
    setSessionBots(state, action: PayloadAction<SessionBot[]>) {
      state.sessionBots = action.payload
    },
    setSessionParticipants(state, action: PayloadAction<SessionParticipant[]>) {
      state.sessionParticipants = action.payload
    },
    setSessionBoardColumns(state, action: PayloadAction<{ id: string; title: string }[] | null>) {
      state.sessionBoardColumns = action.payload
    },
    setSocketJoined(state, action: PayloadAction<boolean>) {
      state.socketJoined = action.payload
    },
    setInviteCode(state, action: PayloadAction<string | null>) {
      state.inviteCode = action.payload
    },
    setQuickAddCard(state, action: PayloadAction<boolean>) {
      state.quickAddCard = action.payload
    },
    setEditingMessage(state, action: PayloadAction<{ id: string; text: string }>) {
      state.editingMessage = action.payload
    },
    clearEditingMessage(state) {
      state.editingMessage = null
    },
    setPendingMention(state, action: PayloadAction<string>) {
      state.pendingMention = action.payload
    },
    clearPendingMention(state) {
      state.pendingMention = null
    },
    setAquariumFocusedBotId(state, action: PayloadAction<string | null>) {
      state.aquariumFocusedBotId = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setAquariumBotTab(state, action: PayloadAction<{ botId: string; tab: string }>) {
      state.aquariumBotTabs[action.payload.botId] = action.payload.tab
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setActiveViewMode(state, action: PayloadAction<string>) {
      state.activeViewMode = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setDashboardView(state, action: PayloadAction<string>) {
      state.dashboardView = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setBoardColumnWidths(state, action: PayloadAction<number[] | null>) {
      state.boardColumnWidths = action.payload
      persistToLocalStorage(getPersistedPrefs(state))
    },
    toggleRightPanel(state) {
      state.rightPanelCollapsed = !state.rightPanelCollapsed
      persistToLocalStorage(getPersistedPrefs(state))
    },
    toggleRightPanelSection(state, action: PayloadAction<keyof RightPanelSections>) {
      const key = action.payload
      state.rightPanelSections[key] = !state.rightPanelSections[key]
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
    toggleMasterHintsPanel(state) {
      state.masterHintsPanelCollapsed = !state.masterHintsPanelCollapsed
      persistToLocalStorage(getPersistedPrefs(state))
    },
    setMasterHintsPanelWidth(state, action: PayloadAction<number>) {
      state.masterHintsPanelWidth = action.payload
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
      if (prefs.rightPanelSections) state.rightPanelSections = { ...state.rightPanelSections, ...prefs.rightPanelSections }
      if (prefs.inputBarHeight) state.inputBarHeight = prefs.inputBarHeight
      if (prefs.masterHintsPanelCollapsed !== undefined) state.masterHintsPanelCollapsed = prefs.masterHintsPanelCollapsed
      if (prefs.masterHintsPanelWidth) state.masterHintsPanelWidth = prefs.masterHintsPanelWidth
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
  editMessage,
  deleteMessage,
  startStream,
  appendStreamChunk,
  endStream,
  setCards,
  addCard,
  updateCard,
  removeCard,
  updateSession,
  updatePhase,
  setSocketJoined,
  setSessionTitle,
  setScenarioInfo,
  setSessionBots,
  setSessionParticipants,
  setSessionBoardColumns,
  setInviteCode,
  setQuickAddCard,
  setBoardColumnWidths,
  toggleRightPanel,
  toggleRightPanelSection,
  setRightPanelWidth,
  toggleLeftSidebar,
  setLeftSidebarWidth,
  setInputBarHeight,
  toggleMasterHintsPanel,
  setMasterHintsPanelWidth,
  stopAllStreams,
  setEditingMessage,
  clearEditingMessage,
  setPendingMention,
  clearPendingMention,
  setAquariumFocusedBotId,
  setAquariumBotTab,
  setActiveViewMode,
  setDashboardView,
} = appSlice.actions
