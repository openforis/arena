import { useSelector } from 'react-redux'

import * as JobState from './state'

export const useJob = () => {
  const hasJob = useSelector(JobState.hasJob)
  const closeButton = useSelector(JobState.getCloseButton)
  const job = useSelector(JobState.getJob)
  return hasJob ? { job, closeButton } : {}
}
