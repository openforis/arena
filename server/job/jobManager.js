const R = require('ramda')

const db = require('../db/db')

const {throttle} = require('../../common/functionsDefer')
const {jobEvents} = require('../../common/ws/wsEvents')

const JobRepository = require('./jobRepository')
const {jobStatus, jobToJSON} = require('./jobUtils')

// ==== USER SOCKETS

let userSockets = {}

const getUserSockets = userId => R.prop(userId, userSockets)

const addUserSocket = (userId, socket) => userSockets = R.assocPath([userId, socket.id], socket, userSockets)

const deleteUserSocket = (userId, socketId) => userSockets = R.dissocPath([userId, socketId], userSockets)

const init = (io) => {

  io.on('connection', async socket => {
    // Send a JOB_UPDATE message if the user has an active job
    const userId = socket.request.session.passport.user
    if (userId) {
      addUserSocket(userId, socket)

      const job = await fetchActiveJobByUserId(userId)

      if (job) {
        notifyJobUpdate(job)
      }

      socket.on('disconnect', () => {
        deleteUserSocket(userId, socket.id)
      })
    }
  })

}

const notifyJobUpdate = async job => {
  const sockets = getUserSockets(job.userId)
  if (sockets && !R.isEmpty(sockets)) {
    R.forEachObjIndexed((socket) => {
      throttle(job => socket.emit(jobEvents.update, jobToJSON(job)), `socket_${socket.id}`, 250)(job)
    }, sockets)
  }
}

const assocInnerJobs = async job => {
  if (job) {
    const innerJobs = await JobRepository.fetchJobsByParentId(job.id)

    return {
      ...job,
      innerJobs
    }
  } else {
    return null
  }
}

// ====== CREATE

const insertJobAndInnerJobs = async (job, t) => {
  const jobDb = await JobRepository.insertJob(job, t)
  job.id = jobDb.id
  job.masterJobId = job.masterJobId ? job.masterJobId : job.id

  for (const innerJob of job.innerJobs) {
    innerJob.parentId = job.id
    innerJob.masterJobId = job.masterJobId
    await insertJobAndInnerJobs(innerJob, t)
  }
}

const insertJob = async (job) => {
  await db.tx(async t =>
    await insertJobAndInnerJobs(job, t)
  )
}

// ====== READ

const fetchActiveJobByUserId = async userId => {
  const job = await JobRepository.fetchActiveJobByUserId(userId)
  return await assocInnerJobs(job)

}

const fetchJobById = async id => {
  const job = await JobRepository.fetchJobById(id)
  return await assocInnerJobs(job)
}

// ====== UPDATE

const cancelActiveJobByUserId = async (userId) => {
  const job = await JobRepository.fetchActiveJobByUserId(userId)
  if (job &&
    job.status !== jobStatus.succeeded &&
    job.status !== jobStatus.failed &&
    job.status !== jobStatus.canceled) {
    await JobRepository.updateJobStatus(job.id, jobStatus.canceled, job.total, job.processed)
  }
}

module.exports = {
  init,
  notifyJobUpdate,
  //CREATE
  insertJob,
  //READ
  fetchJobById,
  //UPDATE
  updateJobStatus: JobRepository.updateJobStatus,
  updateJobProgress: JobRepository.updateJobProgress,
  cancelActiveJobByUserId,
}