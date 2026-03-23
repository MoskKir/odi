const API_BASE = '/api/scenarios'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export interface BotStageContext {
  id: string
  scenarioId: string
  stageName: string
  botConfigId: string
  roleDescription: string | null
  methodologicalTask: string | null
  tone: string | null
  triggers: string[] | null
  forbidden: string[] | null
  responseTemplates: { trigger: string; template: string }[] | null
  fallbackBehavior: string | null
  active: boolean
}

export interface StageSharedContext {
  id: string
  scenarioId: string
  stageName: string
  purpose: string | null
  methodologicalTask: string | null
  keyConcepts: string[] | null
  criticalMoments: { when: string; action: string }[] | null
}

export interface BotContextsResponse {
  botContexts: BotStageContext[]
  sharedContexts: StageSharedContext[]
}

export async function fetchBotContexts(scenarioId: string): Promise<BotContextsResponse> {
  const res = await fetch(`${API_BASE}/${scenarioId}/bot-contexts`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch bot contexts')
  return res.json()
}

export async function upsertBotContext(
  scenarioId: string,
  dto: Partial<BotStageContext>,
): Promise<BotStageContext> {
  const res = await fetch(`${API_BASE}/${scenarioId}/bot-contexts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to upsert bot context')
  }
  return res.json()
}

export async function deleteBotContext(scenarioId: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${scenarioId}/bot-contexts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete bot context')
}

export async function upsertSharedContext(
  scenarioId: string,
  dto: Partial<StageSharedContext>,
): Promise<StageSharedContext> {
  const res = await fetch(`${API_BASE}/${scenarioId}/bot-contexts/shared`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to upsert shared context')
  }
  return res.json()
}

export async function deleteSharedContext(scenarioId: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${scenarioId}/bot-contexts/shared/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete shared context')
}
