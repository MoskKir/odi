const API_BASE = '/api/scenarios'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export interface ScenarioResponse {
  id: string
  slug: string
  icon: string
  title: string
  subtitle: string
  description: string
  difficulty: string
  published: boolean
  requiredBots: string[]
  recommendedBots: string[]
  avgDurationMinutes: number | null
  sessionsCount: number
}

export interface CreateScenarioDto {
  slug: string
  icon: string
  title: string
  subtitle: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  published: boolean
  requiredBots: string[]
  recommendedBots: string[]
  avgDurationMinutes: number | null
}

export async function fetchScenarios(): Promise<ScenarioResponse[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch scenarios')
  return res.json()
}

export async function fetchScenario(id: string): Promise<ScenarioResponse> {
  const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch scenario')
  return res.json()
}

export async function updateScenario(id: string, dto: Partial<CreateScenarioDto>): Promise<ScenarioResponse> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update scenario')
  }
  return res.json()
}

export async function deleteScenario(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to delete scenario')
  }
}

export async function createScenario(dto: CreateScenarioDto): Promise<ScenarioResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create scenario')
  }
  return res.json()
}
