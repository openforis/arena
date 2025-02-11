import { enqueue } from './jobQueue'

export const enqueueJob = (jobInfo) => {
  enqueue(jobInfo)
}
