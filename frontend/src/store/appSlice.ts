import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Emotion, ChatMessage, BoardCard, Theme, FontSize } from '@/types'

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
  devMode: false,
  theme: 'dark',
  fontSize: 16,
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
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    setFontSize(state, action: PayloadAction<FontSize>) {
      state.fontSize = action.payload
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
