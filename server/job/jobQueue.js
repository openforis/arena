import { Objects, Queue } from '@openforis/arena-core'

import { executeJobThread } from './jobThreadExecutor'

const queue = new Queue()

const maxConcurrentJobs = 3
let runningGlobalJob = false
const runningJobUuidByUuid = {}
const runningJobUuidBySurveyId = {}
const runningJobUuidByUserUuid = {}
const jobInfoByUuid = {}

const isRunning = () => Objects.isNotEmpty(runningJobUuidByUuid)

const onJobEnd = (job) => {
  const jobInfo = jobInfoByUuid[job.uuid]

  const { uuid, params } = jobInfo
  const { user, surveyId } = params
  const { uuid: userUuid } = user

  delete jobInfoByUuid[uuid]
  delete runningJobUuidByUuid[uuid]
  delete runningJobUuidByUserUuid[userUuid]
  if (surveyId) {
    delete runningJobUuidBySurveyId[surveyId]
  } else {
    runningGlobalJob = false
  }
  startNextJob()
}

const onJobUpdate = (job) => {
  const { ended } = job
  if (ended) {
    onJobEnd(job)
  }
}

const findNextJobIndex = () =>
  queue.items.findIndex((jobInfo) => {
    const { params } = jobInfo
    const { surveyId, user } = params ?? {}
    const { uuid: userUuid } = user
    return !(runningJobUuidByUserUuid[userUuid] || (surveyId ? runningJobUuidBySurveyId[surveyId] : runningGlobalJob))
  })

const startNextJob = () => {
  if (queue.isEmpty() || Object.keys(runningJobUuidByUuid).length === maxConcurrentJobs) {
    return
  }
  const nextJobIndex = findNextJobIndex()
  if (nextJobIndex >= 0) {
    const jobInfo = queue.items.splice(nextJobIndex, 1)[0]
    const { uuid, params } = jobInfo
    const { surveyId, user } = params ?? {}
    const { uuid: userUuid } = user
    runningJobUuidByUuid[uuid] = uuid
    runningJobUuidByUserUuid[userUuid] = uuid
    if (surveyId) {
      runningJobUuidBySurveyId[surveyId] = uuid
    } else {
      runningGlobalJob = true
    }
    executeJobThread(jobInfo, onJobUpdate)
  }
}

export const enqueue = (job) => {
  const { uuid, type, params } = job
  const jobInfo = { uuid, type, params }
  queue.enqueue(jobInfo)
  jobInfoByUuid[uuid] = jobInfo

  if (!isRunning()) {
    startNextJob()
  }
}
