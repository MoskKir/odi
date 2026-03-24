export type ViewMode = 'board' | 'theatre' | 'graph' | 'hq' | 'aquarium' | 'terminal'

export type Emotion = 'happy' | 'angry' | 'calm' | 'sad'

export type BotRole = 'moderator' | 'critic' | 'visionary'

export type GameStatus = 'active' | 'paused' | 'completed' | 'draft'

export interface GameListItem {
  id: string
  title: string
  scenario: string
  status: GameStatus
  crewSize: number
  date: string
  duration: string
  progress: number
}

export interface GameSession {
  id: string
  title: string
  elapsed: string
  teamSize: number
  teamOnline: number
  energy: number
}

export interface ChatMessage {
  id: string
  author: string
  role: string
  text: string
  timestamp: number
  participantId?: string
  isEdited?: boolean
}

export interface BoardCard {
  id: string
  column: string
  text: string
  author: string
  votes: number
  orderIndex: number
}

export interface RightPanelWidget {
  id: string
  label: string
  collapsible: boolean
  defaultOpen: boolean
  availableIn: ViewMode[]
}

// Mission Control types

export type ScenarioId = 'business' | 'creative' | 'teambuilding'

export interface Scenario {
  id: ScenarioId
  icon: string
  title: string
  subtitle: string
  recommended: SpecialistId[]
  required: SpecialistId[]
}

export type SpecialistId =
  | 'moderator'
  | 'critic'
  | 'visionary'
  | 'analyst'
  | 'peacemaker'
  | 'provocateur'
  | 'keeper'
  | 'expert'

export interface Specialist {
  id: SpecialistId
  name: string
  description: string
  stars: number
  tag?: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'
export type Duration = 30 | 60 | 90 | 0
export type InterfaceMode = 'chameleon' | 'board' | 'theatre' | 'terminal'
export type AiVisibility = 'hidden' | 'captain' | 'team'

export type Theme = 'dark' | 'light'
export type FontSize = number
