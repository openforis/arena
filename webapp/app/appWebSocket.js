import io from 'socket.io-client'

import * as cognitoAuth from '../utils/cognitoAuth'

let socket = null

export const openSocket = async () => {
  const token = await cognitoAuth.getJwtToken()
  socket = io(window.location.origin, {
    query: { token: token },
  })

  socket.on('reconnect_attempt', async () => {
    const token = await cognitoAuth.getJwtToken()
    socket.io.opts.query = { token: token }
  })
}

export const on = (eventName, eventHandler) => socket && socket.on(eventName, eventHandler)

export const closeSocket = () => {
  if (socket) {
    socket.close()
  }

  socket = null
}
