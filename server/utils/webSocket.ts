import ioFactory from 'socket.io';
const io = ioFactory();
import * as R from 'ramda';
import WebSocketEvents from '../../common/webSocket/webSocketEvents';
import {getLogger} from '../log/log'
import * as Request from './request';
import Jwt from './jwt';

const Logger = getLogger('WebSocket')

const socketsById = new Map() //Map(<[socketId]:socket>)
const socketIdsByUserUuid = new Map() //Map(<[userUuid]>:Set(socketIds))

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

const notifySocket = (socketId, eventType, message) => {
  const socket = socketsById.get(socketId)
  socket.emit(eventType, message)
}

const notifyUser = (userUuid, eventType, message) => {
  const socketIds = socketIdsByUserUuid.get(userUuid)
  for (const socketId of socketIds) {
    notifySocket(socketId, eventType, message)
  }
}

const init = (server, jwtMiddleware) => {

  io.attach(server)

  io.use((socket, next) => {
    // Set the request authorization header from socket handshake
    const token = socket.handshake.query.token
    socket.request.headers.authorization = Jwt.bearerPrefix + token

    // Wrap the jwtMiddleware to get the user id
    jwtMiddleware(socket.request, {}, next)
  })

  io.on(WebSocketEvents.connection, async socket => {
    const userUuid = R.pipe(
      R.prop('request'),
      Request.getUserUuid,
    )(socket)

    Logger.debug(`socket connection with id: ${socket.id} for userUuid ${userUuid}`)

    if (userUuid) {
      addSocket(userUuid, socket)

      socket.on(WebSocketEvents.disconnect, () => {
        deleteSocket(userUuid, socket.id)
      })
    }
  })

}

export default {
  init,
  notifySocket,
  notifyUser,
};
