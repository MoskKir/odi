import { OverlayToaster, Position } from '@blueprintjs/core'

const toaster = OverlayToaster.createAsync({
  position: Position.BOTTOM_RIGHT,
  maxToasts: 3,
})

export async function showToast(message: string, intent: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
  const t = await toaster
  t.show({ message, intent, timeout: intent === 'danger' ? 5000 : 3000 })
}

export function success(message: string) {
  showToast(message, 'success')
}

export function error(message: string) {
  showToast(message, 'danger')
}

export function warning(message: string) {
  showToast(message, 'warning')
}
