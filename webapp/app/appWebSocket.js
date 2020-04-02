import io from 'socket.io-client'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

let socket = null

export const openSocket = async (throwErrorFn) => {
  const throwError = (error) => {
    throwErrorFn(error)
    closeSocket()
  }

  socket = io(window.location.origin)

  on(WebSocketEvents.connectError, (error) => throwError(error.stack))
  on(WebSocketEvents.error, throwError)
}

export const on = (eventName, eventHandler) => socket && socket.on(eventName, eventHandler)

export const off = (eventName) => socket && socket.off(eventName)

export const closeSocket = () => {
  if (socket) {
    socket.close()
  }

  socket = null
}
