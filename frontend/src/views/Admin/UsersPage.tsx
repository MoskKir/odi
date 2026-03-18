import {
  Card,
  InputGroup,
  Tag,
  Button,
  HTMLSelect,
  Spinner,
  NonIdealState,
  Popover,
  FormGroup,
  Dialog,
  DialogBody,
  DialogFooter,
} from '@blueprintjs/core'
import { useState, useEffect, useCallback } from 'react'
import {
  fetchUsers,
  createUser,
  updateUser,
  type UserResponse,
} from '@/api/users'

const ROLE_CONFIG: Record<string, { label: string; intent: 'danger' | 'warning' | 'none' }> = {
  admin: { label: 'Админ', intent: 'danger' },
  moderator: { label: 'Модератор', intent: 'warning' },
  user: { label: 'Пользователь', intent: 'none' },
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
    } catch {
      setError('Не удалось изменить роль')
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
        <h2 className="text-xl font-bold text-odi-text">Пользователи</h2>
        <Button icon="plus" intent="success" text="Добавить" onClick={() => setCreateOpen(true)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <InputGroup
          leftIcon="search"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!w-64"
        />
        <HTMLSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Все роли</option>
          <option value="admin">Админы</option>
          <option value="moderator">Модераторы</option>
          <option value="user">Пользователи</option>
        </HTMLSelect>
        <div className="flex-1" />
        <Tag minimal>{filtered.length} из {total}</Tag>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={32} /></div>
      ) : error ? (
        <NonIdealState
          icon="error"
          title="Ошибка"
          description={error}
          action={<Button text="Повторить" small onClick={loadUsers} />}
        />
      ) : filtered.length === 0 ? (
        <NonIdealState
          icon={search || roleFilter !== 'all' ? 'search' : 'people'}
          title={search || roleFilter !== 'all' ? 'Ничего не найдено' : 'Нет пользователей'}
          description={search || roleFilter !== 'all' ? 'Измените фильтры' : 'Добавьте первого пользователя'}
        />
      ) : (
        <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-odi-border text-left">
                <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Пользователь</th>
                <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Роль</th>
                <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Последняя активность</th>
                <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Статус</th>
                <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Регистрация</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user
                return (
                  <tr key={user.id} className="border-b border-odi-border last:border-0 hover:bg-odi-surface-hover">
                    <td className="px-4 py-3">
                      <div className="text-odi-text font-medium">{user.name}</div>
                      <div className="text-xs text-odi-text-muted">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Popover
                        placement="bottom"
                        content={
                          <div className="p-2 space-y-1">
                            {ROLES.map((r) => (
                              <Button
                                key={r.value}
                                text={r.label}
                                minimal
                                small
                                fill
                                active={user.role === r.value}
                                loading={updatingRole === user.id}
                                onClick={() => handleRoleChange(user.id, r.value)}
                                className="!justify-start"
                              />
                            ))}
                          </div>
                        }
                      >
                        <Tag
                          minimal
                          intent={roleCfg.intent}
                          round
                          className="text-[10px] cursor-pointer"
                          interactive
                        >
                          {roleCfg.label}
                        </Tag>
                      </Popover>
                    </td>
                    <td className="px-4 py-3 text-odi-text-muted text-xs">
                      {fmtDate(user.lastActiveAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-odi-border'}`} />
                        <span className="text-xs text-odi-text-muted">{user.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-odi-text-muted text-xs">
                      {fmtDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] text-odi-text-muted font-mono">{user.id.slice(0, 8)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый пользователь"
        className="!bg-odi-surface"
      >
        <DialogBody>
          <div className="space-y-3">
            <FormGroup label="Имя" labelInfo="(обязательно)">
              <InputGroup
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </FormGroup>
            <FormGroup label="Email" labelInfo="(обязательно)">
              <InputGroup
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
              />
            </FormGroup>
            <FormGroup label="Пароль" labelInfo="(обязательно)">
              <InputGroup
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                type="password"
              />
            </FormGroup>
            <FormGroup label="Роль">
              <HTMLSelect value={newRole} onChange={(e) => setNewRole(e.target.value)} fill>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </HTMLSelect>
            </FormGroup>
            {createError && <div className="text-sm text-red-500">{createError}</div>}
          </div>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Отмена" minimal onClick={() => setCreateOpen(false)} />
              <Button
                text="Создать"
                intent="success"
                loading={creating}
                disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim()}
                onClick={handleCreate}
              />
            </>
          }
        />
      </Dialog>
    </div>
  )
}
