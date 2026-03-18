const API_BASE = '/api/admin/users'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('odi_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: 'admin' | 'moderator' | 'user'
  isOnline: boolean
  lastActiveAt: string | null
  createdAt: string
}

export interface UsersListResponse {
  items: UserResponse[]
  total: number
}

export async function fetchUsers(params?: {
  limit?: number
  offset?: number
  search?: string
}): Promise<UsersListResponse> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.search) qs.set('search', params.search)
  const url = qs.toString() ? `${API_BASE}?${qs}` : API_BASE
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function createUser(dto: {
  name: string
  email: string
  password: string
  role: string
}): Promise<UserResponse> {
  // Register via auth endpoint
  const regRes = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dto.name, email: dto.email, password: dto.password }),
  })
  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create user')
  }
  const { user } = await regRes.json()

  // Set role if not default
  if (dto.role && dto.role !== 'user') {
    const headers = getAuthHeaders()
    await fetch(`${API_BASE}/${user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role: dto.role }),
    })
  }

  return { ...user, isOnline: false, lastActiveAt: null, createdAt: new Date().toISOString() }
}

export async function updateUser(
  id: string,
  dto: { name?: string; role?: string; isOnline?: boolean },
): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(dto),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update user')
  }
  return res.json()
}
