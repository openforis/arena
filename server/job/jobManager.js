import { enqueue } from './jobQueue'

export { getActiveJobSummary, cancelActiveJobByUserUuid } from './jobThreadExecutor'

export const enqueueJob = (jobInfo) => {
  enqueue(jobInfo).catch(() => {
    // ignore it
  })
}
