import io from 'socket.io-client'

let socket = null

export const openSocket = () => {
  socket = io(window.location.origin)
}

export const onSocketEvent = (name, fn) => socket.on(name, fn)

export const closeSocket = () => {
  socket.close()
  socket = null
}
