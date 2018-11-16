const {Worker} = require('worker_threads')
const R = require('ramda')
const path = require('path')

const {throttle} = require('../../common/functionsDefer')
const {jobEvents} = require('../../common/ws/wsEvents')

const {jobThreadMessageTypes} = require('./jobUtils')

// ==== USER SOCKETS

let userSockets = {}

const getUserSockets = userId => R.prop(userId, userSockets)

const addUserSocket = (userId, socket) => userSockets = R.assocPath([userId, socket.id], socket, userSockets)

const deleteUserSocket = (userId, socketId) => userSockets = R.dissocPath([userId, socketId], userSockets)

// USER JOB WORKERS

const userJobWorkers = {}

const getUserJobWorker = userId => userJobWorkers[userId]

const addUserJobWorker = (userId, worker) => userJobWorkers[userId] = worker

const deleteUserJobWorker = userId => delete userJobWorkers[userId]

const init = (io) => {

  io.on('connection', async socket => {
    const userId = socket.request.session.passport.user
    if (userId) {
      addUserSocket(userId, socket)

      const jobWorker = getUserJobWorker(userId)
      if (jobWorker) {
        jobWorker.postMessage({type: jobThreadMessageTypes.fetchJob})
      }

      socket.on('disconnect', () => {
        deleteUserSocket(userId, socket.id)
      })
    }
  })

}

const notifyJobUpdate = job => {
  const userId = job.userId

  const sockets = getUserSockets(userId)
  if (sockets && !R.isEmpty(sockets)) {
    R.forEachObjIndexed((socket) => {
      throttle(job => socket.emit(jobEvents.update, job), `socket_${socket.id}`, 500)(job)
    }, sockets)
  }

  if (job.ended) {
    deleteUserJobWorker(userId)
  }
}

// ====== UPDATE

const cancelActiveJobByUserId = async (userId) => {
  const jobWorker = getUserJobWorker(userId)
  if (jobWorker) {
    jobWorker.postMessage({type: jobThreadMessageTypes.cancelJob})
  }
}

// ====== EXECUTE

const executeJobThread = (job) => {

  const worker = new Worker(
    path.resolve(__dirname, 'jobThread.js'),
    {workerData: {jobType: job.type, params: job.params}}
  )

  worker.on('message', async job =>
    await notifyJobUpdate(job)
  )

  const userId = job.params.userId
  if (userId) {
    addUserJobWorker(userId, worker)
  }
}

module.exports = {
  init,

  executeJobThread,

  cancelActiveJobByUserId,
}