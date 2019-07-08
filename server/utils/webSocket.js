const io = require('socket.io')()
const R = require('ramda')

const Request = require('./request')
const Jwt = require('../modules/auth/jwt')

// ==== USER SOCKETS

let userSockets = {}

const getUserSockets = userId => R.propOr({}, userId, userSockets)

const addUserSocket = (userId, socket) => { userSockets = R.assocPath([userId, socket.id], socket, userSockets) }

const deleteUserSocket = (userId, socketId) => { userSockets = R.dissocPath([userId, socketId], userSockets) }

const notifyUser = (userId, eventType, message) => R.pipe(
  getUserSockets,
  R.forEachObjIndexed(
    socket => socket.emit(eventType, message),
  )
)(userId)

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
    const userId = R.pipe(
      R.prop('request'),
      Request.getSessionUserId,
    )(socket)

    if (userId) {
      addUserSocket(userId, socket)

      socket.on('disconnect', () => {
        deleteUserSocket(userId, socket.id)
      })
    }
  })

}

module.exports = {
  init,
  notifyUser,
}