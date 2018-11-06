const io = require('socket.io')()
const jobManager = require('../job/jobManager')

const init = (server, sessionMiddleware) => {

  io.attach(server)

  io.use((socket, next) => {
    // Wrap the sessionMiddleware to get the user id
    sessionMiddleware(socket.request, {}, next)
  })

  jobManager.init(io)

}

module.exports = {
  init
}