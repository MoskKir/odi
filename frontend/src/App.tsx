import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { DevBar } from '@/components/DevBar'
import { GameList } from '@/views/GameList/GameList'
import { MissionControl } from '@/views/MissionControl/MissionControl'
import { GameLayout } from '@/layouts/GameLayout'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DevBar />
        <Routes>
          <Route path="/" element={<GameList />} />
          <Route path="/mission" element={<MissionControl />} />
          <Route path="/game" element={<Navigate to="/game/board" replace />} />
          <Route path="/game/:viewMode" element={<GameLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
