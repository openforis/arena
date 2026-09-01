import io from 'socket.io-client'
import axios from 'axios'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

let socket = null

/**
 * Intercept every request and add the socket ID in the headers (using key "socketid").
 */
axios.interceptors.request.use((config) => {
  if (socket?.id) {
    config.headers.socketid = socket.id
  }
  return config
})

export const updateSocketToken = (newToken) => {
  if (socket) {
    socket.auth.token = newToken

    if (!socket.connected) {
      socket.connect()
    }
  }
}

export const closeSocket = () => {
  socket?.close()

  socket = null
}

export const on = (eventName, eventHandler) => socket?.on(eventName, eventHandler)

export const off = (eventName, eventHandler) => socket?.off(eventName, eventHandler)

export const openSocket = async (throwErrorFn) => {
  const throwError = (error) => {
    throwErrorFn(error)
    closeSocket()
  }

  const authToken = ApiConstants.getAuthToken()

  socket = io(globalThis.window.location.origin, {
    auth: { token: authToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
  })

  on(WebSocketEvents.connectError, (err) => {
    if (err.message === 'Unauthorized') {
      updateSocketToken(ApiConstants.getAuthToken())
    }
  })

  on(WebSocketEvents.error, throwError)
}
