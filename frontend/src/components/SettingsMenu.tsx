import { Button, Popover, Menu, MenuItem, MenuDivider, Switch } from '@blueprintjs/core'
import { useAppSelector, useAppDispatch } from '@/store'
import { setTheme, setFontSize, toggleDevMode } from '@/store/appSlice'

const MIN_FONT = 12
const MAX_FONT = 24
const STEP = 1

export function SettingsMenu() {
  const { theme, fontSize, devMode } = useAppSelector((s) => s.app)
  const dispatch = useAppDispatch()

  const content = (
    <Menu className="!bg-odi-surface !text-odi-text">
      <MenuDivider title="Тема" />
      <MenuItem
        icon="flash"
        text="Светлая"
        active={theme === 'light'}
        onClick={() => dispatch(setTheme('light'))}
      />
      <MenuItem
        icon="moon"
        text="Тёмная"
        active={theme === 'dark'}
        onClick={() => dispatch(setTheme('dark'))}
      />
      <MenuDivider title="Размер шрифта" />
      <li className="px-2 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <Button
            icon="minus"
            minimal
            small
            disabled={fontSize <= MIN_FONT}
            onClick={() => dispatch(setFontSize(Math.max(MIN_FONT, fontSize - STEP)))}
          />
          <span className="text-sm font-mono text-odi-text min-w-[40px] text-center">
            {fontSize}px
          </span>
          <Button
            icon="plus"
            minimal
            small
            disabled={fontSize >= MAX_FONT}
            onClick={() => dispatch(setFontSize(Math.min(MAX_FONT, fontSize + STEP)))}
          />
        </div>
      </li>
      <MenuDivider title="Разработчик" />
      <li className="px-3 py-1.5">
        <Switch
          checked={devMode}
          label="Режим разработчика"
          onChange={() => dispatch(toggleDevMode())}
          className="!mb-0 !text-sm"
        />
      </li>
    </Menu>
  )

  return (
    <Popover content={content} placement="bottom-end">
      <Button icon="cog" minimal className="!text-odi-text-muted" />
    </Popover>
  )
}
