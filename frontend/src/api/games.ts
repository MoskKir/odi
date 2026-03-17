const API_BASE = '/api/games'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export interface GameSessionResponse {
  id: string
  title: string
  status: string
  difficulty: string
  durationMinutes: number
  interfaceMode: string
  aiVisibility: string
  crewSize: number
  progress: number
  energy: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  scenario?: { title: string; subtitle: string; icon: string }
  participants?: { id: string; role: string; slotIndex: number }[]
}

export interface GameListResponse {
  items: GameSessionResponse[]
  total: number
}

export interface CreateGamePayload {
  title: string
  scenarioSlug: string
  difficulty: string
  durationMinutes: number
  interfaceMode: string
  aiVisibility: string
  crewSize: number
  specialistIds: string[]
}

export async function createGame(payload: CreateGamePayload): Promise<GameSessionResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || 'Failed to create game')
  }
  return res.json()
}

export async function updateGameTitle(id: string, title: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/title`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to update title')
}

export async function fetchGames(params?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<GameListResponse> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.search) query.set('search', params.search)
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))

  const qs = query.toString()
  const res = await fetch(`${API_BASE}${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch games')
  return res.json()
}
