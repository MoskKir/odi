import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FormGroup, InputGroup, Button, Callout } from '@blueprintjs/core'
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
      <h2 className="text-lg font-bold text-odi-text mb-4">Регистрация</h2>

      {displayError && (
        <Callout intent="danger" className="mb-4 !text-sm">
          {displayError}
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
