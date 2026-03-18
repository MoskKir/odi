const API_BASE = '/api/bots'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface BotResponse {
  id: string
  specialistId: string
  name: string
  description: string
  personality: string
  model: string
  enabled: boolean
  stars: number
  tag: string | null
  usageCount: number
  avgRating: number
}

export async function fetchBots(): Promise<BotResponse[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch bots')
  return res.json()
}
