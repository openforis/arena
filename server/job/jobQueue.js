import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { isMainThread } from 'worker_threads'

import * as ProcessUtils from '@core/processUtils'
import * as JobThreadExecutor from './jobThreadExecutor'
import { initJobQueueEvents, notifyUser } from './jobQueueEvents'

const connection = ProcessUtils.ENV.redisHost
  ? new IORedis({ host: ProcessUtils.ENV.redisHost, port: ProcessUtils.ENV.redisPort, maxRetriesPerRequest: null })
  : null
const queueName = 'jobQueue'
const bullQueue = connection ? new Queue(queueName, { connection }) : null
const concurrency = 1

const enabled = !!bullQueue

const userUuidByJobUuid = {}
const surveyIdByJobUuid = {}

let worker = null

// getters

const getJobSummary = async ({ jobUuid }) => {
  const activeJob = await getActiveJobByUuid({ jobUuid })
  if (activeJob) {
    return activeJob
  }
  const bullJob = await bullQueue.getJob(jobUuid)
  if (bullJob) {
    const { data } = bullJob
    const { params, type } = data ?? {}
    const { user, surveyId } = params
    return { uuid: jobUuid, type, user, surveyId }
  }
  return null
}

const getActiveJobs = async (filterFn) => {
  const activeJobs = await bullQueue.getActive()
  const jobInfos = activeJobs.filter(filterFn).map((bullJob) => bullJob.data)
  const jobSummaries = JobThreadExecutor.getActiveJobSummaries()
  return jobInfos.map((jobInfo) => jobSummaries.find((summary) => summary.uuid === jobInfo.uuid))
}

const getActiveJobByUuid = async (jobUuid) => (await getActiveJobs((bullJob) => bullJob.data?.uuid === jobUuid))[0]

const getActiveJobsByUserUuid = async (userUuid) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.user?.uuid === userUuid)

const getActiveJobByUserUuid = async (userUuid) => (await getActiveJobByUserUuid(userUuid))[0]

const getActiveJobsBySurveyId = async (surveyId) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.surveyId === surveyId)

const getUserUuidByJobUuid = (jobUuid) => userUuidByJobUuid[jobUuid]
const getSurveyIdByJobUuid = (jobUuid) => surveyIdByJobUuid[jobUuid]

const jobQueueReader = { getUserUuidByJobUuid, getJobSummary }

// init worker
if (enabled && !worker && isMainThread) {
  const onJobUpdate =
    ({ bullJob, resolve, reject }) =>
    (job) => {
      const { ended, errors, failed, progressPercent } = job
      if (ended) {
        if (failed) {
          reject(new Error(JSON.stringify(errors)))
        } else {
          resolve()
        }
      } else {
        bullJob.updateProgress(progressPercent).catch(() => {
          // ignore it
        })
      }
    }

  const processJob = (bullJob) => {
    const { data: jobInfo } = bullJob
    return new Promise((resolve, reject) => {
      JobThreadExecutor.executeJobThread(jobInfo, onJobUpdate({ bullJob, resolve, reject }))
    })
  }

  worker = new Worker(queueName, processJob, { connection, concurrency })

  // init queue events handler
  initJobQueueEvents({ queueName, connection, jobQueue: jobQueueReader })
}

// enquee
const enqueue = async (job) => {
  const { type, params, uuid } = job
  const { surveyId, user } = params ?? {}

  if (user) {
    userUuidByJobUuid[uuid] = user.uuid
  }
  if (surveyId) {
    surveyIdByJobUuid[uuid] = surveyId
  }
  await bullQueue.add('job', { type, params, uuid }, { jobId: uuid })
  return job
}

// cancel
const cancelActiveJobByUserUuid = JobThreadExecutor.cancelActiveJobByUserUuid

const cancelJob = async (jobUuid) => {
  const job = await bullQueue.getJob(jobUuid)
  if (job) {
    if ((await job.getState()) === 'waiting') {
      await job.remove()
      notifyUser({ jobUuid, status: 'canceled', jobQueue: jobQueueReader })
    }
  } else {
    const activeJob = JobThreadExecutor.getActiveJobSummaryByUuid(jobUuid)
    if (activeJob) {
      JobThreadExecutor.cancelActiveJobByUserUuid(activeJob.userUuid)
    }
  }
}

// destroy
const destroy = worker?.close

export {
  enabled,
  enqueue,
  getJobSummary,
  getActiveJobByUuid,
  getActiveJobsBySurveyId,
  getActiveJobsByUserUuid,
  getActiveJobByUserUuid,
  getUserUuidByJobUuid,
  getSurveyIdByJobUuid,
  cancelActiveJobByUserUuid,
  cancelJob,
  destroy,
}
