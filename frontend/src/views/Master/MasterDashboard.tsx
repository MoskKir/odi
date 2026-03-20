import { useGameSocket } from '@/hooks/useGameSocket'
import { SessionHeader } from './panels/SessionHeader'
import { PhaseControl } from './panels/PhaseControl'
import { ParticipantsPanel } from './panels/ParticipantsPanel'
import { BotControl } from './panels/BotControl'
import { MasterChat } from './panels/MasterChat'
import { ActivityLog } from './panels/ActivityLog'
import { EmotionMonitor } from './panels/EmotionMonitor'
import { QuickActions } from './panels/QuickActions'

export function MasterDashboard() {
  useGameSocket()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SessionHeader />
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-2 p-2 overflow-hidden">
        {/* Left column */}
        <div className="row-span-2 flex flex-col gap-2 overflow-hidden">
          <PhaseControl />
          <QuickActions />
        </div>

        {/* Center top */}
        <div className="col-span-2 overflow-hidden">
          <MasterChat />
        </div>

        {/* Right column top */}
        <div className="overflow-hidden">
          <ParticipantsPanel />
        </div>

        {/* Center bottom */}
        <div className="overflow-hidden">
          <BotControl />
        </div>
        <div className="overflow-hidden">
          <EmotionMonitor />
        </div>

        {/* Right column bottom */}
        <div className="overflow-hidden">
          <ActivityLog />
        </div>
      </div>
    </div>
  )
}
