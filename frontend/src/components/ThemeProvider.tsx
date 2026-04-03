import { useEffect } from 'react'
import { useAppSelector } from '@/store'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((s) => s.app.theme)
  const fontSize = useAppSelector((s) => s.app.fontSize)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <TooltipProvider delayDuration={300}>
      {children}
      <Toaster
        theme={theme as 'dark' | 'light'}
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </TooltipProvider>
  )
}
