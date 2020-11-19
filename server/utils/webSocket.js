import * as socketIoServer from 'socket.io'
import * as R from 'ramda'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('WebSocket')

const socketByClientId = new Map() // Map(<[socketClientId]:socket>)
const socketClientIdsByUserUuid = new Map() // Map(<[userUuid]>:Set(socketClientIds))

const addSocket = (userUuid, socket) => {
  const socketClientId = socket.client.id
  socketByClientId.set(socketClientId, socket)

  if (!socketClientIdsByUserUuid.has(userUuid)) {
    socketClientIdsByUserUuid.set(userUuid, new Set())
  }

  socketClientIdsByUserUuid.get(userUuid).add(socketClientId)
}

const deleteSocket = (userUuid, socketClientId) => {
  socketByClientId.delete(socketClientId)

  const userSocketClientIds = socketClientIdsByUserUuid.get(userUuid)
  userSocketClientIds.delete(socketClientId)

  if (userSocketClientIds.size === 0) {
    socketClientIdsByUserUuid.delete(userUuid)
  }
}

export const notifySocket = (socketClientId, eventType, message) => {
  const socket = socketByClientId.get(socketClientId)
  Logger.debug(`notifying socket with client ID ${socketClientId}`)

  if (socket) {
    Logger.debug(`notifying socket with ID ${socket.id}`)
    socket.emit(eventType, message)
  } else {
    Logger.error(`socket with client ID ${socketClientId} not found!`)
  }
}

export const notifyUser = (userUuid, eventType, message) => {
  const socketClientIds = socketClientIdsByUserUuid.get(userUuid)
  socketClientIds.forEach((socketClientId) => notifySocket(socketClientId, eventType, message))
}

export const init = (server, sessionMiddleware) => {
  socketIoServer(server, { cookie: true })
    .use((socket, next) => {
      // Wrap the sessionMiddleware to get the user uuid
      sessionMiddleware(socket.request, {}, next)
    })
    .on(WebSocketEvents.connection, async (socket) => {
      const userUuid = R.path(['request', 'session', 'passport', 'user'], socket)

      const socketClientId = socket.client.id

      const socketDetails = `ID: ${socket.id} - Client ID: ${socketClientId} - User UUID: ${userUuid}`

      Logger.debug(`socket connected (${socketDetails})`)

      if (userUuid) {
        addSocket(userUuid, socket)

        socket.on(WebSocketEvents.disconnect, () => {
          Logger.debug(`socket disconnected (${socketDetails})`)
          deleteSocket(userUuid, socketClientId)
        })
      }
    })
}
