import { useEffect } from 'react'
import { useAppSelector } from '@/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((s) => s.app.theme)
  const fontSize = useAppSelector((s) => s.app.fontSize)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return <>{children}</>
}
