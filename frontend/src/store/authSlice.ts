import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { apiLogin, apiRegister, apiGetMe } from '@/api/auth'

export interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Restore session from localStorage token
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async () => {
    const user = await apiGetMe()
    return user
  },
)

export const loginAsync = createAsyncThunk(
  'auth/loginAsync',
  async ({ email, password }: { email: string; password: string }) => {
    const res = await apiLogin(email, password)
    localStorage.setItem('odi_token', res.accessToken)
    return res.user
  },
)

export const registerAsync = createAsyncThunk(
  'auth/registerAsync',
  async ({ name, email, password }: { name: string; email: string; password: string }) => {
    const res = await apiRegister(name, email, password)
    localStorage.setItem('odi_token', res.accessToken)
    return res.user
  },
)

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('odi_token')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // loginAsync
    builder.addCase(loginAsync.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(loginAsync.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message || 'Ошибка входа'
    })

    // registerAsync
    builder.addCase(registerAsync.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(registerAsync.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(registerAsync.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message || 'Ошибка регистрации'
    })

    // restoreSession
    builder.addCase(restoreSession.fulfilled, (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(restoreSession.rejected, (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('odi_token')
    })
  },
})

export const { logout, clearError } = authSlice.actions
