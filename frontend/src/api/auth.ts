const API_BASE = '/api/auth'

export interface AuthResponse {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || 'Неверный email или пароль')
  }
  return res.json()
}

export async function apiRegister(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || 'Ошибка регистрации')
  }
  return res.json()
}

export async function apiGetMe(): Promise<AuthResponse['user']> {
  const token = localStorage.getItem('odi_token')
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Token invalid')
  return res.json()
}
