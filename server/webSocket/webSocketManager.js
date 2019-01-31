const io = require('socket.io')()
const R = require('ramda')

const { throttle } = require('../../common/functionsDefer')

// ==== USER SOCKETS

let userSockets = {}

const getUserSockets = userId => R.prop(userId, userSockets)

const addUserSocket = (userId, socket) => userSockets = R.assocPath([userId, socket.id], socket, userSockets)

const deleteUserSocket = (userId, socketId) => userSockets = R.dissocPath([userId, socketId], userSockets)

const notifyUser = (userId, eventType, message) => {
  const sockets = getUserSockets(userId)
  if (sockets && !R.isEmpty(sockets)) {
    R.forEachObjIndexed((socket) => {
      throttle(message => socket.emit(eventType, message), `socket_${socket.id}`, 500)(message)
    }, sockets)
  }
}

const init = (server, sessionMiddleware) => {

  io.attach(server)

  io.use((socket, next) => {
    // Wrap the sessionMiddleware to get the user id
    sessionMiddleware(socket.request, {}, next)
  })

  io.on('connection', async socket => {
    const userId = R.path(['request', 'session', 'passport', 'user'], socket)
    if (userId) {
      addUserSocket(userId, socket)

      //TODO notify user immediately if there is a running job?
      /*
      const jobWorker = getUserJobWorker(userId)
      if (jobWorker) {
        jobWorker.postMessage({type: jobThreadMessageTypes.fetchJob})
      }
      */

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