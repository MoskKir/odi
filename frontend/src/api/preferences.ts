const API_BASE = '/api/auth';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export interface UserPreferences {
  theme?: 'dark' | 'light';
  fontSize?: number;
  devMode?: boolean;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/preferences`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

export async function savePreferences(prefs: UserPreferences): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
  return res.json();
}
