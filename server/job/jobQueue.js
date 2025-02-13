import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

import * as ProcessUtils from '@core/processUtils'
import * as JobThreadExecutor from './jobThreadExecutor'
import { initJobQueueEvents } from './jobQueueEvents'

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

// init worker
if (enabled) {
  const onJobUpdate = async ({ job, bullJob }) => {
    const { ended, progressPercent } = job
    if (!ended) {
      await bullJob.updateProgress(progressPercent)
    }
  }

  const processJob = (bullJob) => {
    const { data: jobInfo } = bullJob
    return new Promise((resolve, reject) => {
      JobThreadExecutor.executeJobThread(jobInfo, (job) => {
        onJobUpdate({ job, bullJob })
          .then(() => {
            if (job.ended) {
              if (job.failed) {
                reject(new Error(JSON.stringify(job.errors)))
              } else {
                resolve()
              }
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    })
  }

  worker = new Worker(queueName, processJob, { connection, concurrency })

  // init queue events handler
  initJobQueueEvents({ queueName, connection, getUserUuidByJobUuid, getJobSummary })
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
  destroy,
}
