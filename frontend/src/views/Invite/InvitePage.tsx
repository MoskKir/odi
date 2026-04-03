import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Ошибка приглашения</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            На главную
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Spinner size={50} />
      <span className="ml-4 text-foreground">Присоединение к игре...</span>
    </div>
  )
}
