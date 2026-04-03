import { toast } from 'sonner'

export function showToast(message: string, intent: 'success' | 'danger' | 'warning' | 'primary' = 'primary') {
  switch (intent) {
    case 'success': toast.success(message); break
    case 'danger': toast.error(message, { duration: 5000 }); break
    case 'warning': toast.warning(message); break
    default: toast(message); break
  }
}

export function success(message: string) {
  toast.success(message)
}

export function error(message: string) {
  toast.error(message, { duration: 5000 })
}

export function warning(message: string) {
  toast.warning(message)
}
