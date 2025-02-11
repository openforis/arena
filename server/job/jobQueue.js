import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { executeJobThread } from './jobThreadExecutor'

const connection = new IORedis({ maxRetriesPerRequest: null })

const queueName = 'jobQueue'

const bullQueue = new Queue(queueName, { connection })

const onJobUpdate = async ({ job, bullJob }) => {
  const { ended, progressPercent } = job
  if (!ended) {
    await bullJob.updateProgress(progressPercent)
  }
  return ended
}

const processJob = (bullJob) => {
  const { data: jobInfo } = bullJob
  return new Promise((resolve, reject) => {
    executeJobThread(jobInfo, (job) => {
      onJobUpdate({ job, bullJob })
        .then((ended) => {
          if (ended) {
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
  concurrency: 1,
})

bullWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`)
})

bullWorker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`)
})

const enqueue = (jobInfo) => {
  bullQueue.add('job', jobInfo)
}

export { enqueue }
