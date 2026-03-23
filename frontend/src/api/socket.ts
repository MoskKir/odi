import { io, Socket } from 'socket.io-client'
import { warning, error as toastError } from '@/utils/toaster'

let socket: Socket | null = null

export function connectSocket(): Socket {
  if (socket) return socket

  const token = localStorage.getItem('odi_token')

  socket = io('/game', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  socket.on('connect_error', () => {
    toastError('Ошибка подключения к серверу')
  })

  socket.on('reconnect', () => {
    warning('Переподключение к серверу...')
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
