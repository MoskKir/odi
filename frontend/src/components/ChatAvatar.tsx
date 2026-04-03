import { Shield, Eye, Sun, Heart, Zap, Bookmark, GraduationCap, BarChart3, type LucideIcon } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
  'bg-lime-600',
  'bg-fuchsia-600',
] as const

const ROLE_STYLES: Record<string, { color: string; icon: LucideIcon }> = {
  moderator:   { color: 'bg-blue-600',    icon: Shield },
  critic:      { color: 'bg-red-600',     icon: Eye },
  visionary:   { color: 'bg-purple-600',  icon: Sun },
  analyst:     { color: 'bg-cyan-600',    icon: BarChart3 },
  peacemaker:  { color: 'bg-emerald-600', icon: Heart },
  provocateur: { color: 'bg-orange-600',  icon: Zap },
  keeper:      { color: 'bg-teal-600',    icon: Bookmark },
  expert:      { color: 'bg-indigo-600',  icon: GraduationCap },
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getColorByName(name: string): string {
  return AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length]
}

interface ChatAvatarProps {
  name: string
  role?: string
  isMine?: boolean
  size?: 'sm' | 'md'
}

export function ChatAvatar({ name, role, isMine, size = 'md' }: ChatAvatarProps) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  const iconSize = size === 'sm' ? 12 : 14
  const textClass = size === 'sm' ? 'text-[10px]' : 'text-xs'

  const roleStyle = role ? ROLE_STYLES[role] : null

  let bgColor: string
  let content: React.ReactNode

  if (isMine) {
    bgColor = 'bg-muted-foreground'
    content = getInitials(name)
  } else if (roleStyle) {
    bgColor = roleStyle.color
    const IconComp = roleStyle.icon
    content = <IconComp size={iconSize} className="text-white" />
  } else {
    bgColor = getColorByName(name)
    content = getInitials(name)
  }

  return (
    <div
      className={`shrink-0 ${sizeClass} rounded-full flex items-center justify-center text-white ${textClass} font-bold ${bgColor}`}
      title={name}
    >
      {content}
    </div>
  )
}
