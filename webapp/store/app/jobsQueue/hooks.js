import { useSelector } from 'react-redux'

import * as JobsQueueState from './state'

export const useJobsQueue = () => useSelector(JobsQueueState.getJobsQueue)
