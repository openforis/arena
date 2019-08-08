const io = require('socket.io')()
const R = require('ramda')

const Request = require('./request')
const Jwt = require('../modules/auth/jwt')

// ==== USER SOCKETS

let userSockets = {}

const getUserSockets = userUuid => R.propOr({}, userUuid, userSockets)

const addUserSocket = (userUuid, socket) => { userSockets = R.assocPath([userUuid, socket.id], socket, userSockets) }

const deleteUserSocket = (userUuid, socketId) => { userSockets = R.dissocPath([userUuid, socketId], userSockets) }

const notifyUser = (userUuid, eventType, message) => R.pipe(
  getUserSockets,
  R.forEachObjIndexed(
    socket => socket.emit(eventType, message),
  )
)(userUuid)

const init = (server, jwtMiddleware) => {

  io.attach(server)

  io.use((socket, next) => {
    // Set the request authorization header from socket handshake
    const token = socket.handshake.query.token
    socket.request.headers.authorization = Jwt.bearerPrefix + token

    // Wrap the jwtMiddleware to get the user id
    jwtMiddleware(socket.request, {}, next)
  })

  io.on('connection', async socket => {
    const userUuid = R.pipe(
      R.prop('request'),
      Request.getUserUuid,
    )(socket)

    if (userUuid) {
      addUserSocket(userUuid, socket)

      socket.on('disconnect', () => {
        deleteUserSocket(userUuid, socket.id)
      })
    }
  })

}

module.exports = {
  init,
  notifyUser,
}