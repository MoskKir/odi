import { useGameSocket } from '@/hooks/useGameSocket'
import { Header } from '@/components/Header/Header'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { MainContent } from '@/components/MainContent/MainContent'
import { RightPanel } from '@/components/RightPanel/RightPanel'
import { InputBar } from '@/components/InputBar/InputBar'
import { QuickAddCard } from '@/components/QuickAddCard'

export function GameLayout() {
  useGameSocket()
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <MainContent />
          <InputBar />
        </div>
        <RightPanel />
      </div>
      <QuickAddCard />
    </div>
  )
}
