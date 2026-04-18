const API_BASE = '/api/llm';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export type LlmProvider = 'openrouter' | 'local' | 'mistral' | 'ollama';

export interface LlmSettings {
  provider: LlmProvider;
  useLocal: boolean;
  localBaseUrl: string;
  localModel: string | null;
  ollamaBaseUrl: string;
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

export async function fetchOllamaModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/models`, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.models ?? [];
}
