import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { restoreSession } from './store/authSlice'
import { loadPreferencesFromServer } from './store/appSlice'
import './index.css'
import App from './App.tsx'

// If token exists, restore session and load preferences from server
if (localStorage.getItem('odi_token')) {
  store.dispatch(restoreSession()).then((result) => {
    if (restoreSession.fulfilled.match(result)) {
      store.dispatch(loadPreferencesFromServer())
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
