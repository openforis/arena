import { JobQueue } from './JobQueue'

const queue = new JobQueue()

// ====== READ

export const getActiveJobSummary = (userUuid) => queue.getRunningJobSummaryByUserUuid(userUuid)

// ====== UPDATE

export const cancelActiveJobByUserUuid = async (userUuid) => queue.cancelJobByUserUuid(userUuid)

// ====== EXECUTE

export const enqueueJob = (job) => {
  queue.enqueue(job)
}
