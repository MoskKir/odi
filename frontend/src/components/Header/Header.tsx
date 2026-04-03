import { useState, useCallback } from 'react'
import { Clock, Users, Link as LinkIcon, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'
import { AppMenu } from '@/components/AppMenu'

export function Header() {
  const { sessionTitle, elapsed, teamOnline, teamSize, energy, inviteCode } =
    useAppSelector((s) => s.app)
  const [copied, setCopied] = useState(false)

  const handleCopyInvite = useCallback(() => {
    if (!inviteCode) return
    const url = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [inviteCode])

  return (
    <header className="bg-card border-b border-border px-4 shrink-0 h-[50px] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-foreground font-bold text-lg">
          ODI: &quot;{sessionTitle}&quot;
        </span>
        <div className="w-px h-5 bg-border mx-1" />
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {elapsed}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {teamOnline}/{teamSize}
        </Badge>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-muted-foreground text-sm">Энергия</span>
          <div className="w-24">
            <Progress value={energy * 10} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {inviteCode && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyInvite}
                  className={`mr-2 ${copied ? 'text-success' : ''}`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                  Пригласить
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Скопировано!' : 'Скопировать ссылку-приглашение'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <AppMenu />
        <AccountBadge />
        <SettingsMenu />
      </div>
    </header>
  )
}
