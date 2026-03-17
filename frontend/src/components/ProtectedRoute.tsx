import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
import { useAppSelector } from '@/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, restoring } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (restoring) {
    return (
      <div className="h-screen flex items-center justify-center bg-odi-bg">
        <Spinner size={40} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
