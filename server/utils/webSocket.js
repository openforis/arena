import * as socketIoServer from 'socket.io'
import * as R from 'ramda'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('WebSocket')

const io = socketIoServer()

const socketsById = new Map() // Map(<[socketId]:socket>)
const socketIdsByUserUuid = new Map() // Map(<[userUuid]>:Set(socketIds))

const addSocket = (userUuid, socket) => {
  const socketId = socket.id
  socketsById.set(socketId, socket)

  if (!socketIdsByUserUuid.has(userUuid)) {
    socketIdsByUserUuid.set(userUuid, new Set())
  }

  socketIdsByUserUuid.get(userUuid).add(socketId)
}

const deleteSocket = (userUuid, socketId) => {
  socketsById.delete(socketId)

  const userSocketIds = socketIdsByUserUuid.get(userUuid)
  userSocketIds.delete(socketId)

  if (userSocketIds.size === 0) {
    socketIdsByUserUuid.delete(userUuid)
  }
}

export const notifySocket = (socketId, eventType, message) => {
  const socket = socketsById.get(socketId)

  if (socket) {
    socket.emit(eventType, message)
  } else {
    Logger.error(`notifying socket with ID ${socketId}: socket not found!`)
  }
}

export const notifyUser = (userUuid, eventType, message) => {
  const socketIds = socketIdsByUserUuid.get(userUuid)
  socketIds.forEach((socketId) => notifySocket(socketId, eventType, message))
}

export const init = (server, sessionMiddleware) => {
  io.attach(server)

  io.use((socket, next) => {
    // Wrap the sessionMiddleware to get the user uuid
    sessionMiddleware(socket.request, {}, next)
  })

  io.on(WebSocketEvents.connection, async (socket) => {
    const userUuid = R.path(['request', 'session', 'passport', 'user'], socket)

    Logger.debug(`socket connected (ID: ${socket.id} - User UUID: ${userUuid})`)

    if (userUuid) {
      addSocket(userUuid, socket)

      socket.on(WebSocketEvents.disconnect, () => {
        Logger.debug(`socket disconnected (ID: ${socket.id} - User UUID: ${userUuid})`)
        deleteSocket(userUuid, socket.id)
      })
    }
  })
}
