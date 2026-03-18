const API_BASE = '/api/bots'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export interface BotResponse {
  id: string
  specialistId: string
  name: string
  description: string
  personality: string
  systemPrompt: string
  model: string
  enabled: boolean
  stars: number
  tag: string | null
  temperature: number
  maxTokens: number
  usageCount: number
  avgRating: number
}

export interface CreateBotDto {
  specialistId: string
  name: string
  description: string
  personality: string
  systemPrompt: string
  model: string
  enabled: boolean
  stars: number
  tag: string | null
  temperature: number
  maxTokens: number
}

export async function fetchBots(): Promise<BotResponse[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch bots')
  return res.json()
}

export async function updateBot(id: string, dto: Partial<CreateBotDto>): Promise<BotResponse> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update bot')
  }
  return res.json()
}

export async function deleteBot(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to delete bot')
  }
}

export async function createBot(dto: CreateBotDto): Promise<BotResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create bot')
  }
  return res.json()
}
