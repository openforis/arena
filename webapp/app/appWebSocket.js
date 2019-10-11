import io from 'socket.io-client'

import WebSocketEvents from '../../core/webSocket/webSocketEvents'

import * as CognitoAuth from './cognitoAuth'

let socket = null

export const openSocket = async (throwErrorFn) => {

  const throwError = (error) => {
    throwErrorFn(error)
    closeSocket()
  }

  const token = await CognitoAuth.getJwtToken()
  socket = io(window.location.origin, {
    query: { token: token },
  })

  on(WebSocketEvents.reconnectAttempt, async () => {
    const token = await CognitoAuth.getJwtToken()
    socket.io.opts.query = { token: token }
  })

  on(WebSocketEvents.connectError, error => throwError(error.stack))
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
