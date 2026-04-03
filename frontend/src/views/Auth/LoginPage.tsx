import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDispatch, useAppSelector } from '@/store'
import { loginAsync, clearError } from '@/store/authSlice'
import { loadPreferencesFromServer } from '@/store/appSlice'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    dispatch(clearError())

    if (!email.trim() || !password.trim()) {
      setLocalError('Заполните все поля')
      return
    }

    const result = await dispatch(loginAsync({ email: email.trim(), password }))
    if (loginAsync.fulfilled.match(result)) {
      dispatch(loadPreferencesFromServer())
      navigate('/dashboard')
    }
  }

  const displayError = localError || error

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-foreground">Вход в аккаунт</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Введите свои данные для входа
      </p>

      {displayError && (
        <Alert variant="destructive" className="mb-4 text-sm rounded-lg">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">Или</span>
        </div>
      </div>

      <button
        type="button"
        className="w-full h-10 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Войти через GitHub
      </button>

      <p className="text-center mt-6 text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-foreground font-medium underline underline-offset-2 hover:text-primary">
          Зарегистрироваться
        </Link>
      </p>
    </AuthLayout>
  )
}
