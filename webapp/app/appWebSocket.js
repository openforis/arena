import io from 'socket.io-client'
import axios from 'axios'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

let socket = null

/**
 * Intercept every request and add the socket ID in the headers (using key "socketid").
 */
const _addSocketIdToEveryRequest = () => {
  axios.interceptors.request.use((config) => {
    // eslint-disable-next-line no-param-reassign
    console.log('_addSocketIdToEveryRequest', socket?.id)
    config.headers.socketid = socket.id
    return config
  })
}

export const closeSocket = () => {
  console.log('CLOSE SOCKET')
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

  socket = io(window.location.origin)
  console.log('OPEN SOCKET', socket.id)

  on(WebSocketEvents.connectError, (error) => throwError(error.stack))
  on(WebSocketEvents.error, throwError)

  _addSocketIdToEveryRequest()
}
