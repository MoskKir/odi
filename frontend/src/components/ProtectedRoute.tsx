import { Navigate, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import { useAppSelector } from '@/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, restoring } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (restoring) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Spinner size={40} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
