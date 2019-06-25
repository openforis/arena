import io from 'socket.io-client'

let socket = null

export const openSocket = () => {
  socket = io(window.location.origin)
}

export const on = (eventName, eventHandler) => socket.on(eventName, eventHandler)

export const closeSocket = () => {
  if (socket) {
    socket.close()
  }

  socket = null
}
