import type { Middleware } from '@reduxjs/toolkit'
import { syncPreferencesToServer } from './appSlice'
import type { RootState } from '.'

const SYNCED_ACTIONS = ['app/setTheme', 'app/setFontSize', 'app/toggleDevMode']

export const preferencesMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action)

  if (SYNCED_ACTIONS.includes(action.type)) {
    const state = store.getState() as RootState
    if (state.auth.isAuthenticated) {
      store.dispatch(
        syncPreferencesToServer({
          theme: state.app.theme,
          fontSize: state.app.fontSize,
          devMode: state.app.devMode,
        }) as any,
      )
    }
  }

  return result
}
