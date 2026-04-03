import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Search, Users, AlertCircle } from 'lucide-react'
import {
  fetchUsers,
  createUser,
  updateUser,
  type UserResponse,
} from '@/api/users'
import { success, error as toastError } from '@/utils/toaster'

const ROLE_CONFIG: Record<string, { label: string; variant: 'danger' | 'warning' | 'outline' }> = {
  admin: { label: 'Админ', variant: 'danger' },
  moderator: { label: 'Модератор', variant: 'warning' },
  user: { label: 'Пользователь', variant: 'outline' },
}

const ROLES = [
  { value: 'user', label: 'Пользователь' },
  { value: 'moderator', label: 'Модератор' },
  { value: 'admin', label: 'Админ' },
]

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return 'Только что'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} мин назад`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} ч назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadUsers = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchUsers({ limit: 200, search: search.trim() || undefined })
      .then((data) => {
        if (cancelled) return
        setUsers(data.items)
        setTotal(data.total)
      })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить пользователей') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadUsers, search])

  const filtered = roleFilter === 'all'
    ? users
    : users.filter((u) => u.role === roleFilter)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    try {
      const updated = await updateUser(userId, { role: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...updated } : u))
      success('Роль изменена')
    } catch {
      toastError('Не удалось изменить роль')
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const user = await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
      })
      setUsers((prev) => [user, ...prev])
      setTotal((t) => t + 1)
      success('Пользователь создан')
      setCreateOpen(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('user')
    } catch (e: any) {
      setCreateError(e.message || 'Ошибка при создании')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Пользователи</h2>
        <Button className="bg-success hover:bg-success/90" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="admin">Админы</SelectItem>
            <SelectItem value="moderator">Модераторы</SelectItem>
            <SelectItem value="user">Пользователи</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Badge variant="outline">{filtered.length} из {total}</Badge>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Ошибка</h3>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" onClick={loadUsers}>Повторить</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {search || roleFilter !== 'all' ? (
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
          ) : (
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
          )}
          <h3 className="text-lg font-medium text-foreground mb-1">
            {search || roleFilter !== 'all' ? 'Ничего не найдено' : 'Нет пользователей'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {search || roleFilter !== 'all' ? 'Измените фильтры' : 'Добавьте первого пользователя'}
          </p>
        </div>
      ) : (
        <Card className="bg-card border-border shadow-none p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Пользователь</th>
                <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Роль</th>
                <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Последняя активность</th>
                <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Статус</th>
                <th className="px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Регистрация</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user
                return (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="cursor-pointer">
                            <Badge
                              variant={roleCfg.variant}
                              className="text-[10px] cursor-pointer"
                            >
                              {roleCfg.label}
                            </Badge>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 space-y-1">
                          {ROLES.map((r) => (
                            <Button
                              key={r.value}
                              variant={user.role === r.value ? 'default' : 'ghost'}
                              size="sm"
                              className="w-full justify-start"
                              disabled={updatingRole === user.id}
                              onClick={() => handleRoleChange(user.id, r.value)}
                            >
                              {r.label}
                            </Button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fmtDate(user.lastActiveAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-border'}`} />
                        <span className="text-xs text-muted-foreground">{user.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fmtDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] text-muted-foreground font-mono">{user.id.slice(0, 8)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Новый пользователь</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Имя <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль <span className="text-muted-foreground">(обязательно)</span></Label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError && <div className="text-sm text-red-500">{createError}</div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button
              className="bg-success hover:bg-success/90"
              disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim() || creating}
              onClick={handleCreate}
            >
              {creating ? <Spinner size={16} /> : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
