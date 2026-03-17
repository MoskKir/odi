import { useState } from 'react'
import { Card, InputGroup, Tag, Button, HTMLSelect } from '@blueprintjs/core'

interface UserRow {
  id: string
  name: string
  email: string
  role: 'admin' | 'moderator' | 'user'
  sessions: number
  lastActive: string
  status: 'online' | 'offline'
}

const MOCK_USERS: UserRow[] = [
  { id: '1', name: 'Анна Козлова', email: 'anna@example.com', role: 'admin', sessions: 24, lastActive: 'Сейчас', status: 'online' },
  { id: '2', name: 'Борис Медведев', email: 'boris@example.com', role: 'moderator', sessions: 18, lastActive: '2 ч назад', status: 'offline' },
  { id: '3', name: 'Елена Волкова', email: 'elena@example.com', role: 'user', sessions: 7, lastActive: 'Сейчас', status: 'online' },
  { id: '4', name: 'Дмитрий Соколов', email: 'dmitry@example.com', role: 'user', sessions: 12, lastActive: '1 день', status: 'offline' },
  { id: '5', name: 'Ирина Павлова', email: 'irina@example.com', role: 'moderator', sessions: 31, lastActive: '5 ч назад', status: 'offline' },
  { id: '6', name: 'Сергей Новиков', email: 'sergey@example.com', role: 'user', sessions: 3, lastActive: 'Сейчас', status: 'online' },
]

const ROLE_CONFIG: Record<string, { label: string; intent: 'danger' | 'warning' | 'none' }> = {
  admin: { label: 'Админ', intent: 'danger' },
  moderator: { label: 'Модератор', intent: 'warning' },
  user: { label: 'Пользователь', intent: 'none' },
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const filtered = MOCK_USERS.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-odi-text">Пользователи</h2>
        <Button icon="plus" intent="success" text="Добавить" />
      </div>

      <div className="flex items-center gap-3">
        <InputGroup
          leftIcon="search"
          placeholder="Поиск..."
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
        <Tag minimal>{filtered.length} из {MOCK_USERS.length}</Tag>
      </div>

      <Card className="!bg-odi-surface !border-odi-border !shadow-none !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-odi-border text-left">
              <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Пользователь</th>
              <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Роль</th>
              <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Сессии</th>
              <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Последняя активность</th>
              <th className="px-4 py-3 text-xs text-odi-text-muted uppercase tracking-wider font-medium">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const roleCfg = ROLE_CONFIG[user.role]
              return (
                <tr key={user.id} className="border-b border-odi-border last:border-0 hover:bg-odi-surface-hover">
                  <td className="px-4 py-3">
                    <div className="text-odi-text font-medium">{user.name}</div>
                    <div className="text-xs text-odi-text-muted">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Tag minimal intent={roleCfg.intent} round className="text-[10px]">{roleCfg.label}</Tag>
                  </td>
                  <td className="px-4 py-3 text-odi-text-muted">{user.sessions}</td>
                  <td className="px-4 py-3 text-odi-text-muted">{user.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-odi-success' : 'bg-odi-border'}`} />
                      <span className="text-xs text-odi-text-muted">{user.status === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button icon="more" minimal small />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
