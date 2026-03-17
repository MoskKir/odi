import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormGroup, InputGroup, Button, Callout } from '@blueprintjs/core'
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
      <h2 className="text-lg font-bold text-odi-text mb-4">Вход</h2>

      {displayError && (
        <Callout intent="danger" className="mb-4 !text-sm">
          {displayError}
        </Callout>
      )}

      <form onSubmit={handleSubmit}>
        <FormGroup label="Email" labelFor="email" className="[&_.bp5-label]:!text-odi-text-muted">
          <InputGroup
            id="email"
            type="email"
            placeholder="user@example.com"
            leftIcon="envelope"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            large
          />
        </FormGroup>

        <FormGroup label="Пароль" labelFor="password" className="[&_.bp5-label]:!text-odi-text-muted">
          <InputGroup
            id="password"
            type="password"
            placeholder="Введите пароль"
            leftIcon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            large
          />
        </FormGroup>

        <Button
          type="submit"
          intent="primary"
          large
          fill
          loading={loading}
          text="Войти"
          className="mt-2"
        />
      </form>

      <div className="text-center mt-4 text-sm text-odi-text-muted">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-odi-accent hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </AuthLayout>
  )
}
