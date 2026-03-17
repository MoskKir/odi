const API_BASE = '/api/scenarios'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
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

export async function fetchScenarios(): Promise<ScenarioResponse[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch scenarios')
  return res.json()
}
