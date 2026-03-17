import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LandingPage } from '@/views/Landing/LandingPage'
import { LoginPage } from '@/views/Auth/LoginPage'
import { RegisterPage } from '@/views/Auth/RegisterPage'
import { GameList } from '@/views/GameList/GameList'
import { MissionControl } from '@/views/MissionControl/MissionControl'
import { GameLayout } from '@/layouts/GameLayout'
import { AdminLayout } from '@/views/Admin/AdminLayout'
import { DashboardPage } from '@/views/Admin/DashboardPage'
import { UsersPage } from '@/views/Admin/UsersPage'
import { SessionsPage } from '@/views/Admin/SessionsPage'
import { BotsPage } from '@/views/Admin/BotsPage'
import { ScenariosPage } from '@/views/Admin/ScenariosPage'
import { SystemPage } from '@/views/Admin/SystemPage'
import { MasterLayout } from '@/views/Master/MasterLayout'
import { MasterDashboard } from '@/views/Master/MasterDashboard'

function GameRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/game/board${search}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><GameList /></ProtectedRoute>} />
          <Route path="/mission" element={<ProtectedRoute><MissionControl /></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><GameRedirect /></ProtectedRoute>} />
          <Route path="/game/:viewMode" element={<ProtectedRoute><GameLayout /></ProtectedRoute>} />
          <Route path="/master" element={<ProtectedRoute><MasterLayout /></ProtectedRoute>}>
            <Route index element={<MasterDashboard />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="bots" element={<BotsPage />} />
            <Route path="scenarios" element={<ScenariosPage />} />
            <Route path="system" element={<SystemPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
