import { Objects, Queue } from '@openforis/arena-core'

import { executeJobThread } from './jobThreadExecutor'

const mainQueue = new Queue()

const queueBySurveyId = {}

const maxConcurrentJobs = 3
const runningJobsByUuid = {}
let currentSurveyQueueIndex = 0

const isRunning = () => Objects.isNotEmpty(runningJobsByUuid)

const onJobUpdate = (job) => {
  if (job.ended) {
    delete runningJobsByUuid[job.uuid]
    startNextJob()
  }
}

const startNextJob = () => {
  if (Object.keys(runningJobsByUuid).length === maxConcurrentJobs) {
    return
  }
  // main queue first (admin jobs e.g. survey creation)
  if (!mainQueue.isEmpty()) {
    const jobInfo = mainQueue.dequeue()
    executeJobThread(jobInfo, onJobUpdate)
  } else {
    const queueSurveyId = Object.keys(queueBySurveyId)[currentSurveyQueueIndex]
    const surveyQueue = queueBySurveyId[queueSurveyId]
    const jobInfo = surveyQueue.dequeue()
    currentSurveyQueueIndex = (currentSurveyQueueIndex + 1) % Object.keys(queueBySurveyId).length
    if (surveyQueue.isEmpty()) {
      delete queueBySurveyId[queueSurveyId]
    }
    executeJobThread(jobInfo, onJobUpdate)
  }
}

export const enqueue = (job) => {
  const { uuid, type, params } = job
  const { surveyId } = params
  const jobInfo = { uuid, type, params }
  if (surveyId) {
    const surveyQueue = queueBySurveyId[surveyId] ?? new Queue()
    surveyQueue.enqueue(jobInfo)
    queueBySurveyId[surveyId] = surveyQueue
  } else {
    mainQueue.enqueue(jobInfo)
  }

  if (!isRunning()) {
    startNextJob()
  }
}
