import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const sizeMap = { sm: 16, md: 24, lg: 32 } as const

interface SpinnerProps {
  className?: string
  size?: number | keyof typeof sizeMap
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const px = typeof size === 'string' ? sizeMap[size] : size
  return <Loader2 className={cn('animate-spin text-muted-foreground', className)} size={px} />
}
