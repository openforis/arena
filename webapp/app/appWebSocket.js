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
    config.headers.socketid = socket.id
    return config
  })
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

  socket = io(window.location.origin)

  on(WebSocketEvents.connect, _addSocketIdToEveryRequest)

  on(WebSocketEvents.error, throwError)
}
