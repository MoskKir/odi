import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormGroup, InputGroup, Button, Callout } from '@blueprintjs/core'
import { useAppDispatch } from '@/store'
import { login } from '@/store/authSlice'
import { AuthLayout } from './AuthLayout'

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    // Mock registration
    setTimeout(() => {
      dispatch(login({
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
      }))
      setLoading(false)
      navigate('/dashboard')
    }, 500)
  }

  return (
    <AuthLayout>
      <h2 className="text-lg font-bold text-odi-text mb-4">Регистрация</h2>

      {error && (
        <Callout intent="danger" className="mb-4 !text-sm">
          {error}
        </Callout>
      )}

      <form onSubmit={handleSubmit}>
        <FormGroup label="Имя" labelFor="name" className="[&_.bp5-label]:!text-odi-text-muted">
          <InputGroup
            id="name"
            placeholder="Как вас зовут?"
            leftIcon="person"
            value={name}
            onChange={(e) => setName(e.target.value)}
            large
          />
        </FormGroup>

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
            placeholder="Минимум 6 символов"
            leftIcon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            large
          />
        </FormGroup>

        <FormGroup label="Повторите пароль" labelFor="confirm" className="[&_.bp5-label]:!text-odi-text-muted">
          <InputGroup
            id="confirm"
            type="password"
            placeholder="Ещё раз"
            leftIcon="lock"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            large
          />
        </FormGroup>

        <Button
          type="submit"
          intent="primary"
          large
          fill
          loading={loading}
          text="Создать аккаунт"
          className="mt-2"
        />
      </form>

      <div className="text-center mt-4 text-sm text-odi-text-muted">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-odi-accent hover:underline">
          Войти
        </Link>
      </div>
    </AuthLayout>
  )
}
