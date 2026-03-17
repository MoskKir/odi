import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormGroup, InputGroup, Button, Callout } from '@blueprintjs/core'
import { useAppDispatch } from '@/store'
import { login } from '@/store/authSlice'
import { AuthLayout } from './AuthLayout'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }

    setLoading(true)
    // Mock login
    setTimeout(() => {
      dispatch(login({
        id: '1',
        name: email.split('@')[0],
        email: email.trim(),
      }))
      setLoading(false)
      navigate('/dashboard')
    }, 500)
  }

  return (
    <AuthLayout>
      <h2 className="text-lg font-bold text-odi-text mb-4">Вход</h2>

      {error && (
        <Callout intent="danger" className="mb-4 !text-sm">
          {error}
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
