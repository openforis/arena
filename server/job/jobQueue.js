import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

import { executeJobThread } from './jobThreadExecutor'

const connection = new IORedis({ maxRetriesPerRequest: null })
const queueName = 'jobQueue'
const bullQueue = new Queue(queueName, { connection })
const concurrency = 1

const onJobUpdate = async ({ job, bullJob }) => {
  const { ended, progressPercent } = job
  if (!ended) {
    await bullJob.updateProgress(progressPercent)
  }
}

const processJob = (bullJob) => {
  const { data: jobInfo } = bullJob
  return new Promise((resolve, reject) => {
    executeJobThread(jobInfo, (job) => {
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

const bullWorker = new Worker(queueName, processJob, {
  connection,
  concurrency,
})

bullWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`)
})

bullWorker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`)
})

const enqueue = async (jobInfo) => bullQueue.add('job', jobInfo)

const getActiveJobs = async (filterFn) => {
  const active = await bullQueue.getActive()
  return active.filter(filterFn).map((bullJob) => bullJob.data)
}

const getActiveJobsByUserUuid = async (userUuid) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.user?.uuid === userUuid)

const getActiveJobsBySurveyId = async (userUuid) =>
  getActiveJobs((bullJob) => bullJob.data?.params?.surveyId === userUuid)

export { enqueue, getActiveJobsBySurveyId, getActiveJobsByUserUuid }
