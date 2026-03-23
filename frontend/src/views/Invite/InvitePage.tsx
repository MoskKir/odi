import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner, NonIdealState } from '@blueprintjs/core'
import { resolveInvite, joinGame } from '@/api/games'

export function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    resolveInvite(code)
      .then(async (session) => {
        await joinGame(session.id)
        navigate(`/game/board?session=${session.id}`, { replace: true })
      })
      .catch(() => setError('Недействительная или устаревшая ссылка-приглашение'))
  }, [code, navigate])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-odi-bg">
        <NonIdealState
          icon="error"
          title="Ошибка приглашения"
          description={error}
          action={
            <a href="/dashboard" className="bp5-button bp5-intent-primary">
              На главную
            </a>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-odi-bg">
      <Spinner size={50} />
      <span className="ml-4 text-odi-text">Присоединение к игре...</span>
    </div>
  )
}
