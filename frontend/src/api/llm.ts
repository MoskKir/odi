const API_BASE = '/api/llm';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export interface LlmSettings {
  useLocal: boolean;
  localBaseUrl: string;
  localModel: string | null;
}

export async function fetchLlmSettings(): Promise<LlmSettings> {
  const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch LLM settings');
  return res.json();
}

export async function updateLlmSettings(
  patch: Partial<LlmSettings>,
): Promise<LlmSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update LLM settings');
  return res.json();
}
