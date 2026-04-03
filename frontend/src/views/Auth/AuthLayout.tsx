import { Suspense, lazy } from 'react'
import { SettingsMenu } from '@/components/SettingsMenu'

const PyramidScene = lazy(() => import('@/components/PyramidScene').then((m) => ({ default: m.PyramidScene })))

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-background">
      {/* Left — form */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-8 pt-6">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background font-bold text-sm">O</div>
          <span className="text-base font-semibold text-foreground tracking-tight">ODI Platform</span>
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

      {/* Right — 3D pyramid */}
      <div className="hidden lg:block w-[45%] shrink-0 bg-muted m-2 rounded-xl relative overflow-hidden">
        <Suspense fallback={null}>
          <PyramidScene />
        </Suspense>
        <div className="absolute bottom-6 right-6">
          <SettingsMenu />
        </div>
      </div>

      {/* Settings for mobile (no right panel) */}
      <div className="lg:hidden absolute top-4 right-4">
        <SettingsMenu />
      </div>
    </div>
  )
}
