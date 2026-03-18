const API_BASE = '/api/admin/sessions'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export interface AdminSessionResponse {
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
  host?: { id: string; name: string; email: string }
  participants?: {
    id: string
    role: string
    isOnline: boolean
    userId?: string
    user?: { id: string; name: string }
    botConfigId?: string
    botConfig?: { id: string; name: string; specialistId: string }
  }[]
}

export interface AdminSessionsListResponse {
  items: AdminSessionResponse[]
  total: number
}

export async function fetchAdminSessions(params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<AdminSessionsListResponse> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  const url = qs.toString() ? `${API_BASE}?${qs}` : API_BASE
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function updateSessionStatus(
  id: string,
  status: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update session')
  }
}
