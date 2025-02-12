import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

import * as ProcessUtils from '@core/processUtils'
import * as JobThreadExecutor from './jobThreadExecutor'

const connection = ProcessUtils.ENV.redisHost
  ? new IORedis({ host: ProcessUtils.ENV.redisHost, port: ProcessUtils.ENV.redisPort, maxRetriesPerRequest: null })
  : null
const queueName = 'jobQueue'
const bullQueue = connection ? new Queue(queueName, { connection }) : null
const concurrency = 1

const enabled = !!bullQueue

// init worker

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

new Worker(queueName, processJob, { connection, concurrency })

const getActiveJobs = async (filterFn) => {
  const activeJobs = await bullQueue.getActive()
  return activeJobs.filter(filterFn).map((bullJob) => bullJob.data)
}

// getters

const getActiveJobByUuid = async (jobUuid) => getActiveJobs((bullJob) => bullJob.data?.uuid === jobUuid)[0]

const getActiveJobsByUserUuid = async (userUuid) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.user?.uuid === userUuid)

const getActiveJobByUserUuid = async (userUuid) => getActiveJobByUserUuid(userUuid)[0]

const getActiveJobsBySurveyId = async (surveyId) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.surveyId === surveyId)

// enquee
const enqueue = async (job) => {
  const { type, params, uuid } = job
  await bullQueue.add('job', { type, params, uuid })
  return job
}

// cancel
const cancelActiveJobByUserUuid = JobThreadExecutor.cancelActiveJobByUserUuid

export {
  enabled,
  cancelActiveJobByUserUuid,
  enqueue,
  getActiveJobByUuid,
  getActiveJobsBySurveyId,
  getActiveJobsByUserUuid,
  getActiveJobByUserUuid,
}
