import { useSelector } from 'react-redux'

import * as JobsQueueState from './state'

export const useJobsQueue = () =>
  useSelector(JobsQueueState.getJobsQueue)?.filter?.((job) => job.queueStatus === 'waiting')
