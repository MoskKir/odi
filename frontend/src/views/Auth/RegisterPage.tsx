import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Callout } from '@blueprintjs/core'
import { useAppDispatch, useAppSelector } from '@/store'
import { registerAsync, clearError } from '@/store/authSlice'
import { loadPreferencesFromServer } from '@/store/appSlice'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    dispatch(clearError())

    if (!name.trim() || !email.trim() || !password.trim()) {
      setLocalError('Заполните все поля')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setLocalError('Пароль должен быть не менее 6 символов')
      return
    }

    const result = await dispatch(registerAsync({
      name: name.trim(),
      email: email.trim(),
      password,
    }))
    if (registerAsync.fulfilled.match(result)) {
      dispatch(loadPreferencesFromServer())
      navigate('/dashboard')
    }
  }

  const displayError = localError || error

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-odi-text">Создать аккаунт</h2>
      <p className="text-sm text-odi-text-muted mt-1 mb-6">
        Заполните данные для регистрации
      </p>

      {displayError && (
        <Callout intent="danger" className="mb-4 !text-sm !rounded-lg">
          {displayError}
        </Callout>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-odi-text mb-1.5">
            Имя
          </label>
          <input
            id="name"
            type="text"
            placeholder="Как вас зовут?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-odi-border bg-odi-bg text-odi-text text-sm placeholder:text-odi-text-muted/50 focus:outline-none focus:ring-2 focus:ring-odi-accent/40 focus:border-odi-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-odi-text mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-odi-border bg-odi-bg text-odi-text text-sm placeholder:text-odi-text-muted/50 focus:outline-none focus:ring-2 focus:ring-odi-accent/40 focus:border-odi-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-odi-text mb-1.5">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-odi-border bg-odi-bg text-odi-text text-sm placeholder:text-odi-text-muted/50 focus:outline-none focus:ring-2 focus:ring-odi-accent/40 focus:border-odi-accent transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-odi-text mb-1.5">
            Повторите пароль
          </label>
          <input
            id="confirm"
            type="password"
            placeholder="Ещё раз"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-odi-border bg-odi-bg text-odi-text text-sm placeholder:text-odi-text-muted/50 focus:outline-none focus:ring-2 focus:ring-odi-accent/40 focus:border-odi-accent transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-odi-text text-odi-bg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Создание...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-odi-text-muted">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-odi-text font-medium underline underline-offset-2 hover:text-odi-accent">
          Войти
        </Link>
      </p>
    </AuthLayout>
  )
}
