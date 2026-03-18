import { Navbar, Tag, ProgressBar } from '@blueprintjs/core'
import { useAppSelector } from '@/store'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AccountBadge } from '@/components/AccountBadge'

export function Header() {
  const { sessionTitle, elapsed, teamOnline, teamSize, energy } =
    useAppSelector((s) => s.app)

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
        <AccountBadge />
        <SettingsMenu />
      </Navbar.Group>
    </Navbar>
  )
}
