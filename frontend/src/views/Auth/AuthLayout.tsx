import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((s) => s.app.theme)

  return (
    <div className={`${theme === 'dark' ? 'bp5-dark' : ''} h-screen flex items-center justify-center bg-odi-bg relative`}>
      <div className="absolute top-4 right-4">
        <SettingsMenu />
      </div>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{'\u{1F3AE}'}</div>
          <h1 className="text-2xl font-bold text-odi-text">ODI</h1>
          <p className="text-sm text-odi-text-muted mt-1">
            Организационно-деятельностная игра
          </p>
        </div>
        <div className="bg-odi-surface border border-odi-border rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
