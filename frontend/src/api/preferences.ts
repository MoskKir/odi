const API_BASE = '/api/auth';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export interface RightPanelSections {
  scenario?: boolean;
  emotion?: boolean;
  meta?: boolean;
  bots?: boolean;
  chat?: boolean;
}

export interface UserPreferences {
  theme?: 'dark' | 'light';
  fontSize?: number;
  devMode?: boolean;
  leftSidebarCollapsed?: boolean;
  leftSidebarWidth?: number;
  rightPanelCollapsed?: boolean;
  rightPanelWidth?: number;
  inputBarHeight?: number;
  rightPanelSections?: RightPanelSections;
  masterHintsPanelCollapsed?: boolean;
  masterHintsPanelWidth?: number;
  boardColumnWidths?: number[] | null;
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
