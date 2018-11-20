import io from 'socket.io-client'
import * as R from 'ramda'

let socket = null

export const openSocket = (eventHandlers = {}) => {
  socket = io(window.location.origin)
  R.forEachObjIndexed((fn, eventName) => socket.on(eventName, fn), eventHandlers)
}

export const closeSocket = () => {
  socket.close()
  socket = null
}
