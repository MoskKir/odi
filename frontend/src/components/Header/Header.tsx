import { useState, useCallback } from 'react'
import { Navbar, Tag, ProgressBar, Button, Tooltip } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'

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
    <Navbar className="!bg-odi-surface border-b border-odi-border px-4 shrink-0">
      <Navbar.Group>
        <Navbar.Heading className="text-odi-text font-bold text-lg">
          ODI: "{sessionTitle}"
        </Navbar.Heading>
        <Navbar.Divider />
        <Tag minimal icon="time" className="mr-2">
          {elapsed}
        </Tag>
        <Tag minimal icon="people" className="mr-2">
          {teamOnline}/{teamSize}
        </Tag>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-odi-text-muted text-sm">Энергия</span>
          <div className="w-24">
            <ProgressBar
              value={energy / 10}
              intent="primary"
              stripes={false}
              animate={false}
            />
          </div>
        </div>
      </Navbar.Group>
      <Navbar.Group align="right">
        {inviteCode && (
          <Tooltip content={copied ? 'Скопировано!' : 'Скопировать ссылку-приглашение'}>
            <Button
              minimal
              icon="link"
              text="Пригласить"
              onClick={handleCopyInvite}
              intent={copied ? 'success' : 'none'}
              className="mr-2"
            />
          </Tooltip>
        )}
        <AccountBadge />
        <SettingsMenu />
      </Navbar.Group>
    </Navbar>
  )
}
