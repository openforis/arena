import * as JobQueue from './jobQueue'

// ====== READ

export const getActiveJobSummary = (userUuid) => {
  // TODO
}

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => {
  // TODO
}

// ====== EXECUTE

export const enqueueJob = (job) => {
  JobQueue.enqueue(job)
}
