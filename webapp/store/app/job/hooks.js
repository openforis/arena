import { useSelector } from 'react-redux'

import * as JobState from './state'

export const useJob = () => {
  const hasJob = useSelector(JobState.hasJob)
  const job = useSelector(JobState.getJob)
  const closeButton = useSelector(JobState.getCloseButton)
  const errorKeyHeaderName = useSelector(JobState.getErrorKeyHeaderName)

  if (!hasJob) return {}

  return { job, closeButton, errorKeyHeaderName }
}
